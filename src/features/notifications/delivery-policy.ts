import type { HttpResult } from '@/features/notifications/http';
import type { NotificationDestinationType, NotificationPauseReason } from '@/lib/db/notification-schema';

/** The initial attempt plus four retries. */
export const MAX_DELIVERY_ATTEMPTS = 5;

/** Base delay before each retry. With jitter they add up to roughly an hour. */
export const RETRY_DELAYS_MINUTES = [2, 6, 15, 35] as const;

/** Retry-After beyond this would push a retry past the event's relevance. */
export const MAX_RETRY_AFTER_SECONDS = 60 * 60;

/** Consecutive events that exhaust their retries before a destination pauses. */
export const FAILED_EVENTS_BEFORE_PAUSE = 3;

// Messages are shown to the user and stored. They never include the URL,
// secrets, response bodies, or subscription details.
export type SendResult =
  | { outcome: 'succeeded'; statusCode?: number; providerMessageId?: string }
  | { outcome: 'temporary_failure'; statusCode?: number; message: string; retryAfterSeconds?: number | null }
  | { outcome: 'permanent_failure'; statusCode?: number; message: string };

function describeService(type: Exclude<NotificationDestinationType, 'email'>): string {
  return type === 'discord' ? 'Discord' : 'The endpoint';
}

/** Turns a webhook response into a delivery outcome. */
export function classifyWebhookResult(
  result: HttpResult,
  type: Exclude<NotificationDestinationType, 'email'>,
): SendResult {
  const service = describeService(type);

  switch (result.kind) {
    case 'timeout':
      return { outcome: 'temporary_failure', message: `${service} didn’t respond within 10 seconds.` };
    case 'network_error':
      return {
        outcome: 'temporary_failure',
        message: `Couldn’t connect to ${service.toLowerCase()} (${result.code}).`,
      };
    case 'unsafe_address':
      return {
        outcome: 'permanent_failure',
        message: 'The webhook URL resolves to a private or reserved network address, so EverySub won’t send to it.',
      };
    case 'response':
      break;
  }

  const { status } = result;

  if (status >= 200 && status < 300) {
    return { outcome: 'succeeded', statusCode: status };
  }

  if (status === 429) {
    return {
      outcome: 'temporary_failure',
      statusCode: status,
      message: `${service} is rate limiting requests (429).`,
      retryAfterSeconds: result.retryAfterSeconds ?? readDiscordRetryAfter(result.body),
    };
  }

  if (status === 408 || status === 425 || status >= 500) {
    return {
      outcome: 'temporary_failure',
      statusCode: status,
      message: `${service} returned a temporary error (${status}).`,
      retryAfterSeconds: result.retryAfterSeconds,
    };
  }

  if (status >= 300 && status < 400) {
    return {
      outcome: 'permanent_failure',
      statusCode: status,
      message: `${service} redirected the request (${status}). EverySub doesn’t follow redirects, so use the final URL.`,
    };
  }

  if (type === 'discord' && (status === 401 || status === 403 || status === 404)) {
    return {
      outcome: 'permanent_failure',
      statusCode: status,
      message: `Discord no longer accepts this webhook (${status}). It may have been deleted. Create a new webhook in Discord and update this destination.`,
    };
  }

  return { outcome: 'permanent_failure', statusCode: status, message: `${service} rejected the request (${status}).` };
}

// Discord also reports its rate limit in a JSON body, in seconds.
function readDiscordRetryAfter(body: string): number | null {
  try {
    const parsed: unknown = JSON.parse(body);

    if (typeof parsed === 'object' && parsed !== null && 'retry_after' in parsed) {
      const value = Number(parsed.retry_after);

      return Number.isFinite(value) ? Math.max(0, value) : null;
    }
  } catch {
    // Not JSON; there's no hint to read.
  }

  return null;
}

/**
 * The delay before retrying after `failedAttempt` (1-based), or null once
 * retries are exhausted. Jitter spreads retries by ±20%, and a destination's
 * Retry-After is honored when it asks for longer.
 */
export function getRetryDelayMs(
  failedAttempt: number,
  retryAfterSeconds: number | null | undefined,
  random: () => number = Math.random,
): number | null {
  if (failedAttempt >= MAX_DELIVERY_ATTEMPTS) {
    return null;
  }

  const baseMs = RETRY_DELAYS_MINUTES[failedAttempt - 1] * 60_000;
  const jitteredMs = Math.round(baseMs * (0.8 + random() * 0.4));
  const retryAfterMs = Math.min(retryAfterSeconds ?? 0, MAX_RETRY_AFTER_SECONDS) * 1000;

  return Math.max(jitteredMs, retryAfterMs);
}

export type AttemptResolution =
  | { status: 'succeeded' }
  | { status: 'retrying'; nextAttemptAt: Date }
  | { status: 'failed'; reason: 'permanent' | 'exhausted' };

export function resolveAttempt(input: {
  attemptNumber: number;
  result: SendResult;
  now: Date;
  random?: () => number;
}): AttemptResolution {
  const { result } = input;

  if (result.outcome === 'succeeded') {
    return { status: 'succeeded' };
  }

  if (result.outcome === 'permanent_failure') {
    return { status: 'failed', reason: 'permanent' };
  }

  const delayMs = getRetryDelayMs(input.attemptNumber, result.retryAfterSeconds, input.random);

  return delayMs === null
    ? { status: 'failed', reason: 'exhausted' }
    : { status: 'retrying', nextAttemptAt: new Date(input.now.getTime() + delayMs) };
}

export type DestinationHealthUpdate = {
  consecutiveFailedEvents?: number;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  lastFailureMessage?: string;
  pausedAt?: Date;
  pauseReason?: NotificationPauseReason;
  pauseMessage?: string;
};

/**
 * How one attempt changes its destination's health. A permanent rejection
 * pauses it at once; temporary failures pause it only after several events in
 * a row exhaust their retries. Other destinations are unaffected.
 */
export function getDestinationHealthUpdate(input: {
  consecutiveFailedEvents: number;
  resolution: AttemptResolution;
  result: SendResult;
  now: Date;
}): DestinationHealthUpdate {
  const { result, resolution, now } = input;

  if (result.outcome === 'succeeded') {
    return { consecutiveFailedEvents: 0, lastSuccessAt: now };
  }

  const failure = { lastFailureAt: now, lastFailureMessage: result.message };

  if (resolution.status === 'failed' && resolution.reason === 'permanent') {
    return { ...failure, pausedAt: now, pauseReason: 'rejected', pauseMessage: result.message };
  }

  if (resolution.status !== 'failed') {
    return failure;
  }

  const consecutiveFailedEvents = input.consecutiveFailedEvents + 1;

  if (consecutiveFailedEvents < FAILED_EVENTS_BEFORE_PAUSE) {
    return { ...failure, consecutiveFailedEvents };
  }

  return {
    ...failure,
    consecutiveFailedEvents,
    pausedAt: now,
    pauseReason: 'failing',
    pauseMessage: `Paused after ${consecutiveFailedEvents} notifications in a row couldn’t be delivered. Last error: ${result.message}`,
  };
}
