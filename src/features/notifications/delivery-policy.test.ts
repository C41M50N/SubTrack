import { describe, expect, it } from 'vitest';

import {
  classifyWebhookResult,
  FAILED_EVENTS_BEFORE_PAUSE,
  getDestinationHealthUpdate,
  getRetryDelayMs,
  MAX_DELIVERY_ATTEMPTS,
  resolveAttempt,
  type SendResult,
} from '@/features/notifications/delivery-policy';
import type { HttpResult } from '@/features/notifications/http';

const response = (status: number, extra: Partial<Extract<HttpResult, { kind: 'response' }>> = {}): HttpResult => ({
  kind: 'response',
  status,
  retryAfterSeconds: null,
  body: '',
  ...extra,
});

describe('classifyWebhookResult', () => {
  it.each([200, 202, 204])('treats %i as delivered', (status) => {
    expect(classifyWebhookResult(response(status), 'webhook').outcome).toBe('succeeded');
  });

  it.each([408, 425, 429, 500, 502, 503])('retries %i', (status) => {
    expect(classifyWebhookResult(response(status), 'webhook').outcome).toBe('temporary_failure');
  });

  it.each([301, 302, 400, 401, 403, 404, 410, 422])('treats %i as a permanent rejection', (status) => {
    expect(classifyWebhookResult(response(status), 'webhook').outcome).toBe('permanent_failure');
  });

  it('retries timeouts and network errors', () => {
    expect(classifyWebhookResult({ kind: 'timeout' }, 'webhook').outcome).toBe('temporary_failure');
    expect(classifyWebhookResult({ kind: 'network_error', code: 'ECONNRESET' }, 'discord').outcome).toBe(
      'temporary_failure',
    );
  });

  it('refuses unsafe addresses permanently', () => {
    expect(classifyWebhookResult({ kind: 'unsafe_address' }, 'webhook').outcome).toBe('permanent_failure');
  });

  it('reads Discord’s rate limit hint from the body', () => {
    const result = classifyWebhookResult(response(429, { body: '{"retry_after": 2.5}' }), 'discord');

    expect(result).toMatchObject({ outcome: 'temporary_failure', retryAfterSeconds: 2.5 });
  });

  it('explains a deleted Discord webhook without exposing the URL', () => {
    const result = classifyWebhookResult(response(404, { body: 'secret-ish details' }), 'discord');

    expect(result.outcome).toBe('permanent_failure');
    expect(result.outcome !== 'succeeded' && result.message).toMatch(/Create a new webhook/);
    expect(JSON.stringify(result)).not.toContain('secret-ish');
  });
});

describe('getRetryDelayMs', () => {
  it('allows four retries after the initial attempt, with growing delays', () => {
    const delays = [1, 2, 3, 4].map((attempt) => getRetryDelayMs(attempt, null, () => 0.5));

    expect(delays).toEqual([2, 6, 15, 35].map((minutes) => minutes * 60_000));
    expect(getRetryDelayMs(MAX_DELIVERY_ATTEMPTS, null)).toBeNull();
  });

  it('spreads retries over roughly an hour with ±20% jitter', () => {
    const total = (random: () => number) =>
      [1, 2, 3, 4].reduce((sum, attempt) => sum + (getRetryDelayMs(attempt, null, random) ?? 0), 0);

    expect(total(() => 0)).toBeCloseTo(0.8 * 58 * 60_000);
    expect(total(() => 1)).toBeCloseTo(1.2 * 58 * 60_000);
  });

  it('honors a longer Retry-After, up to an hour', () => {
    expect(getRetryDelayMs(1, 600, () => 0.5)).toBe(600_000);
    expect(getRetryDelayMs(1, 30, () => 0.5)).toBe(120_000);
    expect(getRetryDelayMs(1, 86_400, () => 0.5)).toBe(3_600_000);
  });
});

describe('resolveAttempt and destination health', () => {
  const now = new Date('2026-10-04T13:00:00Z');
  const temporary: SendResult = {
    outcome: 'temporary_failure',
    message: 'The endpoint returned a temporary error (503).',
  };
  const permanent: SendResult = { outcome: 'permanent_failure', message: 'The endpoint rejected the request (410).' };

  it('retries a temporary failure until attempts run out', () => {
    expect(resolveAttempt({ attemptNumber: 1, result: temporary, now, random: () => 0.5 })).toEqual({
      status: 'retrying',
      nextAttemptAt: new Date(now.getTime() + 2 * 60_000),
    });
    expect(resolveAttempt({ attemptNumber: MAX_DELIVERY_ATTEMPTS, result: temporary, now })).toEqual({
      status: 'failed',
      reason: 'exhausted',
    });
  });

  it('pauses a destination at once on a permanent rejection', () => {
    const resolution = resolveAttempt({ attemptNumber: 1, result: permanent, now });

    expect(
      getDestinationHealthUpdate({ consecutiveFailedEvents: 0, resolution, result: permanent, now }),
    ).toMatchObject({
      pausedAt: now,
      pauseReason: 'rejected',
      pauseMessage: permanent.message,
    });
  });

  it('doesn’t count a failure that will be retried', () => {
    const resolution = resolveAttempt({ attemptNumber: 2, result: temporary, now });
    const update = getDestinationHealthUpdate({ consecutiveFailedEvents: 2, resolution, result: temporary, now });

    expect(update).toEqual({ lastFailureAt: now, lastFailureMessage: temporary.message });
  });

  it('pauses after three events in a row exhaust their retries', () => {
    const resolution = resolveAttempt({ attemptNumber: MAX_DELIVERY_ATTEMPTS, result: temporary, now });

    expect(
      getDestinationHealthUpdate({
        consecutiveFailedEvents: FAILED_EVENTS_BEFORE_PAUSE - 2,
        resolution,
        result: temporary,
        now,
      }),
    ).toMatchObject({ consecutiveFailedEvents: 2 });
    expect(
      getDestinationHealthUpdate({
        consecutiveFailedEvents: FAILED_EVENTS_BEFORE_PAUSE - 1,
        resolution,
        result: temporary,
        now,
      }),
    ).toMatchObject({ consecutiveFailedEvents: 3, pauseReason: 'failing', pausedAt: now });
  });

  it('resets the failure count after a success', () => {
    const result: SendResult = { outcome: 'succeeded' };
    const resolution = resolveAttempt({ attemptNumber: 1, result, now });

    expect(getDestinationHealthUpdate({ consecutiveFailedEvents: 2, resolution, result, now })).toEqual({
      consecutiveFailedEvents: 0,
      lastSuccessAt: now,
    });
  });
});
