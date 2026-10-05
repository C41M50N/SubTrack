import { describe, expect, it } from 'vitest';

import {
  buildSignatureHeaders,
  computeSignature,
  generateSigningSecret,
  getUnexpiredSecrets,
  RETIRED_SECRET_GRACE_MS,
  retireSecret,
  verifySignature,
} from '@/features/notifications/signing';

describe('Standard Webhooks signatures', () => {
  it('matches the specification’s published example', () => {
    expect(
      computeSignature({
        id: 'msg_p5jXN8AQM9LWM0D4loKWxJek',
        timestamp: 1614265330,
        body: '{"test": 2432232314}',
        secret: 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw',
      }),
    ).toBe('g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=');
  });

  const now = new Date('2026-10-04T13:00:00Z');
  const timestamp = Math.floor(now.getTime() / 1000);
  const body = JSON.stringify({ id: 'evt_1', type: 'renewal_reminder' });

  it('verifies a request signed with the current secret', () => {
    const secret = generateSigningSecret();
    const headers = buildSignatureHeaders({ id: 'evt_1', timestamp, body, secrets: [secret] });

    expect(headers['webhook-id']).toBe('evt_1');
    expect(
      verifySignature({
        id: headers['webhook-id'],
        timestamp: headers['webhook-timestamp'],
        signatureHeader: headers['webhook-signature'],
        body,
        secret,
        now,
      }),
    ).toEqual({ ok: true });
  });

  it('signs with both secrets during rotation so either verifies', () => {
    const current = generateSigningSecret();
    const previous = generateSigningSecret();
    const headers = buildSignatureHeaders({ id: 'evt_1', timestamp, body, secrets: [current, previous] });

    expect(headers['webhook-signature'].split(' ')).toHaveLength(2);

    for (const secret of [current, previous]) {
      expect(
        verifySignature({
          id: 'evt_1',
          timestamp: String(timestamp),
          signatureHeader: headers['webhook-signature'],
          body,
          secret,
          now,
        }).ok,
      ).toBe(true);
    }
  });

  it('rejects a changed body, the wrong secret, or a replayed timestamp', () => {
    const secret = generateSigningSecret();
    const { 'webhook-signature': signatureHeader } = buildSignatureHeaders({
      id: 'evt_1',
      timestamp,
      body,
      secrets: [secret],
    });
    const base = { id: 'evt_1', timestamp: String(timestamp), signatureHeader, body, secret, now };

    expect(verifySignature({ ...base, body: `${body} ` })).toEqual({ ok: false, reason: 'mismatch' });
    expect(verifySignature({ ...base, secret: generateSigningSecret() })).toEqual({ ok: false, reason: 'mismatch' });
    expect(verifySignature({ ...base, now: new Date(now.getTime() + 10 * 60_000) })).toEqual({
      ok: false,
      reason: 'expired',
    });
    expect(verifySignature({ ...base, signatureHeader: null })).toEqual({ ok: false, reason: 'missing' });
  });
});

describe('retired signing secrets', () => {
  const now = new Date('2026-10-04T13:00:00Z');

  it('keeps every unexpired secret through repeated rotations', () => {
    const once = retireSecret([], 'whsec_first', now);
    const twice = retireSecret(once, 'whsec_second', new Date(now.getTime() + 60_000));

    expect(twice.map((entry) => entry.secret)).toEqual(['whsec_first', 'whsec_second']);
    expect(getUnexpiredSecrets(twice, new Date(now.getTime() + RETIRED_SECRET_GRACE_MS - 1))).toHaveLength(2);
  });

  it('drops secrets once their grace period ends', () => {
    const retired = retireSecret([], 'whsec_first', now);
    const later = new Date(now.getTime() + RETIRED_SECRET_GRACE_MS + 1);

    expect(getUnexpiredSecrets(retired, later)).toEqual([]);
    expect(retireSecret(retired, 'whsec_second', later).map((entry) => entry.secret)).toEqual(['whsec_second']);
  });
});
