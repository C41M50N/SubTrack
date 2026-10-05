import { Resend } from 'resend';
import { ENV } from 'varlock/env';

import type { SendResult } from '@/features/notifications/delivery-policy';
import { parseRetryAfter } from '@/features/notifications/http';
import type { NotificationKind } from '@/lib/db/notification-schema';

const SEND_TIMEOUT_MS = 15_000;
const AVAILABILITY_CACHE_MS = 5 * 60_000;
const FAILED_CHECK_CACHE_MS = 60_000;

export type EmailUnavailableReason =
  | 'not_configured'
  | 'domain_not_found'
  | 'domain_not_verified'
  | 'tracking_enabled'
  | 'check_failed';

export type EmailAvailability =
  | { available: true }
  | { available: false; reason: EmailUnavailableReason; message: string };

let client: Resend | null = null;

function getConfig() {
  const apiKey = ENV.RESEND_API_KEY;
  const from = ENV.RESEND_FROM_ADDRESS;

  return apiKey && from ? { apiKey, from } : null;
}

function getClient(): Resend | null {
  const config = getConfig();

  if (!config) {
    return null;
  }

  client ??= new Resend(config.apiKey);

  return client;
}

/** The domain of a sender like "EverySub <notify@mail.example.com>". */
export function getSenderDomain(from: string): string | null {
  const address = from.match(/<([^>]+)>/)?.[1] ?? from;
  const domain = address.split('@')[1]?.trim().toLowerCase();

  return domain || null;
}

let cachedAvailability: { value: EmailAvailability; expiresAt: number } | null = null;

function unavailable(reason: EmailUnavailableReason, message: string): EmailAvailability {
  return { available: false, reason, message };
}

async function checkSendingDomain(resend: Resend, senderDomain: string): Promise<EmailAvailability> {
  const list = await resend.domains.list();

  // A sending-only API key can't read domains. Sending still reports problems.
  if (list.error?.name === 'restricted_api_key') {
    return { available: true };
  }

  if (list.error) {
    return unavailable('check_failed', 'EverySub couldn’t confirm its email sending domain. Try again later.');
  }

  const listed = list.data.data.find((domain) => domain.name.toLowerCase() === senderDomain);

  if (!listed) {
    return unavailable('domain_not_found', 'The email sending domain isn’t set up in Resend yet.');
  }

  const details = await resend.domains.get(listed.id);

  if (details.error) {
    return unavailable('check_failed', 'EverySub couldn’t confirm its email sending domain. Try again later.');
  }

  const domain = details.data;

  if (domain.status !== 'verified' || domain.capabilities?.sending === 'disabled') {
    return unavailable('domain_not_verified', 'The email sending domain is still being verified in Resend.');
  }

  // Delivery health comes from provider events, never recipient activity.
  if (domain.open_tracking || domain.click_tracking) {
    return unavailable(
      'tracking_enabled',
      'Open or click tracking is on for the email sending domain. Notification emails stay off until it’s turned off in Resend.',
    );
  }

  return { available: true };
}

/**
 * Whether notification emails can be sent: Resend is configured and its
 * sending domain is verified with tracking off. Cached briefly, since the
 * settings page and the scheduler both ask.
 */
export async function getEmailAvailability(): Promise<EmailAvailability> {
  const config = getConfig();
  const resend = getClient();

  if (!config || !resend) {
    return unavailable('not_configured', 'Email delivery isn’t set up on this EverySub server.');
  }

  if (cachedAvailability && cachedAvailability.expiresAt > Date.now()) {
    return cachedAvailability.value;
  }

  const senderDomain = getSenderDomain(config.from);
  let value: EmailAvailability;

  try {
    value = senderDomain
      ? await checkSendingDomain(resend, senderDomain)
      : unavailable('domain_not_found', 'The email sender address is invalid.');
  } catch {
    value = unavailable('check_failed', 'EverySub couldn’t confirm its email sending domain. Try again later.');
  }

  cachedAvailability = {
    value,
    expiresAt:
      Date.now() + (value.available || value.reason !== 'check_failed' ? AVAILABILITY_CACHE_MS : FAILED_CHECK_CACHE_MS),
  };

  return value;
}

const CONFIGURATION_ERRORS = new Set([
  'missing_api_key',
  'invalid_api_key',
  'restricted_api_key',
  'invalid_from_address',
  'invalid_access',
  'security_error',
]);

/**
 * Sends one rendered notification email. The idempotency key makes a retry of
 * an identical request safe after a timeout; Resend keeps keys for 24 hours.
 */
export async function sendNotificationEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  kind: NotificationKind | 'test';
}): Promise<SendResult> {
  const config = getConfig();
  const resend = getClient();

  if (!config || !resend) {
    return { outcome: 'temporary_failure', message: 'Email delivery isn’t set up on this EverySub server.' };
  }

  let response: Awaited<ReturnType<Resend['emails']['send']>>;

  try {
    response = await resend.emails.send(
      {
        from: config.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        tags: [{ name: 'notification', value: input.kind }],
      },
      { idempotencyKey: input.idempotencyKey, signal: AbortSignal.timeout(SEND_TIMEOUT_MS) },
    );
  } catch {
    return { outcome: 'temporary_failure', message: 'Couldn’t reach Resend.' };
  }

  if (response.data) {
    return { outcome: 'succeeded', providerMessageId: response.data.id };
  }

  const { error } = response;
  const statusCode = error.statusCode ?? undefined;

  if (error.statusCode === null) {
    return { outcome: 'temporary_failure', message: 'Couldn’t reach Resend.' };
  }

  if (
    error.statusCode === 429 ||
    error.statusCode >= 500 ||
    error.name === 'concurrent_idempotent_requests' ||
    error.name === 'application_error' ||
    error.name === 'internal_server_error'
  ) {
    return {
      outcome: 'temporary_failure',
      statusCode,
      message: `Resend couldn’t send the email right now (${error.name}).`,
      retryAfterSeconds: parseRetryAfter(response.headers?.['retry-after']),
    };
  }

  // A server misconfiguration isn't the recipient's fault, so it retries
  // rather than pausing email at once.
  if (CONFIGURATION_ERRORS.has(error.name)) {
    return {
      outcome: 'temporary_failure',
      statusCode,
      message: 'Email sending is misconfigured on this EverySub server.',
    };
  }

  // Resend's message can echo request fields, so only its code is kept.
  return { outcome: 'permanent_failure', statusCode, message: `Resend rejected the email (${error.name}).` };
}

export function getResendWebhookSecret(): string | null {
  return ENV.RESEND_WEBHOOK_SECRET || null;
}
