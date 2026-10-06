import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import type { LookupFunction } from 'node:net';

import { getIpVersion, isPublicAddress } from '@/features/notifications/url-safety';

export const WEBHOOK_TIMEOUT_MS = 10_000;

/** Response bodies are only read for error details, so keep them short. */
const MAX_RESPONSE_BYTES = 8 * 1024;

export type HttpResult =
  | { kind: 'response'; status: number; retryAfterSeconds: number | null; body: string }
  | { kind: 'network_error'; code: string }
  | { kind: 'timeout' }
  | { kind: 'unsafe_address' };

/** Reads Retry-After as seconds, from either delay-seconds or an HTTP date. */
export function parseRetryAfter(value: string | string[] | undefined, now = new Date()): number | null {
  const header = Array.isArray(value) ? value[0] : value;

  if (!header) {
    return null;
  }

  const seconds = Number(header);

  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds);
  }

  const date = Date.parse(header);

  return Number.isNaN(date) ? null : Math.max(0, Math.ceil((date - now.getTime()) / 1000));
}

async function resolvePublicAddress(hostname: string): Promise<{ address: string; family: number } | null> {
  const ipVersion = getIpVersion(hostname);

  if (ipVersion !== 0) {
    return isPublicAddress(hostname) ? { address: hostname, family: ipVersion } : null;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });

  // Every answer must be public: a client may connect to any of them.
  if (addresses.length === 0 || !addresses.every((entry) => isPublicAddress(entry.address))) {
    return null;
  }

  return addresses[0];
}

/**
 * POSTs a body to a user-provided HTTPS URL.
 *
 * DNS is resolved once and every address is checked, then the connection is
 * pinned to a checked address, so a DNS answer that changes between the check
 * and the connection can't redirect the request to an internal host. Redirects
 * are never followed; a 3xx is returned like any other response.
 */
export async function postToWebhook(input: {
  url: string;
  body: string;
  headers: Record<string, string>;
  timeoutMs?: number;
}): Promise<HttpResult> {
  const url = new URL(input.url);
  const hostname = url.hostname.startsWith('[') ? url.hostname.slice(1, -1) : url.hostname;

  if (url.protocol !== 'https:') {
    return { kind: 'unsafe_address' };
  }

  let resolved: { address: string; family: number } | null;

  try {
    resolved = await resolvePublicAddress(hostname);
  } catch (error) {
    return { kind: 'network_error', code: errorCode(error) ?? 'DNS_LOOKUP_FAILED' };
  }

  if (!resolved) {
    return { kind: 'unsafe_address' };
  }

  const pinned = resolved;
  const pinnedLookup: LookupFunction = (_hostname, options, callback) => {
    if (options.all) {
      callback(null, [{ address: pinned.address, family: pinned.family }]);
    } else {
      callback(null, pinned.address, pinned.family);
    }
  };

  return new Promise<HttpResult>((resolve) => {
    let settled = false;
    const finish = (result: HttpResult) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(result);
      }
    };

    const req = request(
      {
        protocol: 'https:',
        hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: { ...input.headers, 'content-length': String(Buffer.byteLength(input.body)) },
        lookup: pinnedLookup,
        servername: getIpVersion(hostname) === 0 ? hostname : undefined,
        agent: false,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let received = 0;

        response.on('data', (chunk: Buffer) => {
          if (received < MAX_RESPONSE_BYTES) {
            chunks.push(chunk);
          }

          received += chunk.length;

          // Stop reading a large body; the status is all that matters.
          if (received >= MAX_RESPONSE_BYTES) {
            response.destroy();
            finishWithResponse();
          }
        });
        response.on('end', () => finishWithResponse());
        response.on('error', () => finishWithResponse());

        function finishWithResponse() {
          finish({
            kind: 'response',
            status: response.statusCode ?? 0,
            retryAfterSeconds: parseRetryAfter(response.headers['retry-after']),
            body: Buffer.concat(chunks).subarray(0, MAX_RESPONSE_BYTES).toString('utf8'),
          });
        }
      },
    );

    const timer = setTimeout(() => {
      finish({ kind: 'timeout' });
      req.destroy();
    }, input.timeoutMs ?? WEBHOOK_TIMEOUT_MS);

    req.on('error', (error) => finish({ kind: 'network_error', code: errorCode(error) ?? 'REQUEST_FAILED' }));
    req.end(input.body);
  });
}

function errorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }

  return null;
}
