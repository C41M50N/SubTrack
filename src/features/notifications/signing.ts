import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import type { RetiredSigningSecret } from '@/lib/db/notification-schema';

// Signatures follow the Standard Webhooks spec (https://www.standardwebhooks.com),
// which Resend's Svix-delivered events also use. Receivers can verify EverySub
// requests with any Standard Webhooks library.

const SECRET_PREFIX = 'whsec_';
const SIGNATURE_VERSION = 'v1';

/** How far a signed timestamp may drift from the receiver's clock. */
export const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

/** How long a rotated-out secret keeps signing requests. */
export const RETIRED_SECRET_GRACE_MS = 24 * 60 * 60 * 1000;

/** Caps how many signatures a request carries after rapid rotations. */
const MAX_RETIRED_SECRETS = 5;

/** Retired secrets that still sign requests at `now`. */
export function getUnexpiredSecrets(retired: RetiredSigningSecret[], now: Date): RetiredSigningSecret[] {
  return retired.filter((entry) => Date.parse(entry.expiresAt) > now.getTime());
}

/** Adds the outgoing secret to the retired list, dropping any that expired. */
export function retireSecret(retired: RetiredSigningSecret[], outgoing: string, now: Date): RetiredSigningSecret[] {
  return [
    ...getUnexpiredSecrets(retired, now),
    { secret: outgoing, expiresAt: new Date(now.getTime() + RETIRED_SECRET_GRACE_MS).toISOString() },
  ].slice(-MAX_RETIRED_SECRETS);
}

export function generateSigningSecret(): string {
  return `${SECRET_PREFIX}${randomBytes(32).toString('base64')}`;
}

function secretKey(secret: string): Buffer {
  const encoded = secret.startsWith(SECRET_PREFIX) ? secret.slice(SECRET_PREFIX.length) : secret;

  return Buffer.from(encoded, 'base64');
}

export function computeSignature(input: { id: string; timestamp: number; body: string; secret: string }): string {
  return createHmac('sha256', secretKey(input.secret))
    .update(`${input.id}.${input.timestamp}.${input.body}`)
    .digest('base64');
}

/**
 * Headers for a signed request. Each secret adds a signature, so a receiver
 * holding the current secret or any still-valid rotated-out one can verify it.
 */
export function buildSignatureHeaders(input: {
  id: string;
  timestamp: number;
  body: string;
  secrets: string[];
}): Record<string, string> {
  const signatures = input.secrets.map(
    (secret) =>
      `${SIGNATURE_VERSION},${computeSignature({ id: input.id, timestamp: input.timestamp, body: input.body, secret })}`,
  );

  return {
    'webhook-id': input.id,
    'webhook-timestamp': String(input.timestamp),
    'webhook-signature': signatures.join(' '),
  };
}

export type SignatureCheck = { ok: true } | { ok: false; reason: 'missing' | 'expired' | 'mismatch' };

/** Verifies a Standard Webhooks signature against the raw request body. */
export function verifySignature(input: {
  id: string | null;
  timestamp: string | null;
  signatureHeader: string | null;
  body: string;
  secret: string;
  now?: Date;
}): SignatureCheck {
  if (!input.id || !input.timestamp || !input.signatureHeader) {
    return { ok: false, reason: 'missing' };
  }

  const timestamp = Number(input.timestamp);
  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);

  if (!Number.isInteger(timestamp) || Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: 'expired' };
  }

  const expected = Buffer.from(
    computeSignature({ id: input.id, timestamp, body: input.body, secret: input.secret }),
    'base64',
  );

  for (const candidate of input.signatureHeader.split(' ')) {
    const [version, signature] = candidate.split(',');

    if (version !== SIGNATURE_VERSION || !signature) {
      continue;
    }

    const received = Buffer.from(signature, 'base64');

    if (received.length === expected.length && timingSafeEqual(received, expected)) {
      return { ok: true };
    }
  }

  return { ok: false, reason: 'mismatch' };
}
