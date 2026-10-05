import type { LookupOptions } from 'node:dns';
import { EventEmitter } from 'node:events';
import type { RequestOptions } from 'node:https';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { postToWebhook } from '@/features/notifications/http';

// DNS and the outbound connection are the external boundaries. Address checks
// and connection pinning run for real.
const { lookup, request } = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));

vi.mock('node:dns/promises', () => ({ lookup }));
vi.mock('node:https', () => ({ request }));

const webhook = { url: 'https://hooks.example.com/everysub', body: '{}', headers: {} };
const PUBLIC_V4 = '93.184.215.14';
const PUBLIC_V6 = '2606:2800:21f:cb07:6820:80da:af6b:8b2c';

function answers(...addresses: string[]) {
  return addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }));
}

/** Stands in for a server that accepts every request with a 204. */
function acceptRequests() {
  request.mockImplementation((_options: RequestOptions, onResponse: (response: EventEmitter) => void) =>
    Object.assign(new EventEmitter(), {
      end: () => {
        const response = Object.assign(new EventEmitter(), { statusCode: 204, headers: {}, destroy: () => {} });

        onResponse(response);
        response.emit('end');
      },
      destroy: () => {},
    }),
  );
}

/** Asks the request's lookup function for an address, as the socket would. */
function connectLookup(options: RequestOptions, lookupOptions: LookupOptions) {
  const pinnedLookup = options.lookup;

  if (!pinnedLookup) {
    throw new Error('The request resolves the hostname itself');
  }

  return new Promise((resolve) => {
    pinnedLookup('hooks.example.com', lookupOptions, (error, address, family) => resolve({ error, address, family }));
  });
}

beforeEach(() => {
  lookup.mockReset();
  request.mockReset();
  acceptRequests();
});

describe('postToWebhook', () => {
  it.each([
    ['a private IPv4 address after a public one', answers(PUBLIC_V4, '10.0.0.5')],
    ['cloud metadata before a public address', answers('169.254.169.254', PUBLIC_V4)],
    ['IPv6 loopback beside a public IPv6 address', answers(PUBLIC_V6, '::1')],
    ['an IPv4-mapped private address', answers(PUBLIC_V4, '::ffff:192.168.1.10')],
  ])('refuses a host whose DNS answers include %s', async (_case, addresses) => {
    lookup.mockResolvedValue(addresses);

    await expect(postToWebhook(webhook)).resolves.toEqual({ kind: 'unsafe_address' });
    expect(request).not.toHaveBeenCalled();
  });

  it('sends to a host whose DNS answers are all public', async () => {
    lookup.mockResolvedValue(answers(PUBLIC_V4, PUBLIC_V6));

    await expect(postToWebhook(webhook)).resolves.toEqual({
      kind: 'response',
      status: 204,
      retryAfterSeconds: null,
      body: '',
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('pins the connection to the checked address', async () => {
    // A rebinding DNS server would answer with a private address the second time.
    lookup.mockResolvedValueOnce(answers(PUBLIC_V4)).mockResolvedValue(answers('127.0.0.1'));

    await postToWebhook(webhook);

    const [options] = request.mock.lastCall as [RequestOptions];

    expect(lookup).toHaveBeenCalledTimes(1);
    // The certificate is still checked against the hostname.
    expect(options).toMatchObject({ hostname: 'hooks.example.com', servername: 'hooks.example.com' });
    await expect(connectLookup(options, {})).resolves.toEqual({ error: null, address: PUBLIC_V4, family: 4 });
    await expect(connectLookup(options, { all: true })).resolves.toEqual({
      error: null,
      address: [{ address: PUBLIC_V4, family: 4 }],
    });
  });
});
