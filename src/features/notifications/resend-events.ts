import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  notificationDestinationTable,
  notificationEventTable,
  resendWebhookEventTable,
  type EmailDeliveryStatus,
} from '@/lib/db/notification-schema';

// Resend reports what happened to an accepted email through Svix-signed
// webhooks. Only delivery events matter here; opens and clicks are never
// used, and tracking stays off.

type ResendEmailEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    bounce?: { type?: string };
    tags?: Record<string, string>;
  };
};

/**
 * How long an unmatched event for a scheduled notification email is retried.
 * Resend can report on an email before its ID is saved: the send returns,
 * then the outcome commits a moment later, or after a crashed attempt is
 * retried with the same idempotency key.
 */
const UNMATCHED_RETRY_WINDOW_MS = 15 * 60_000;

/** Whether Resend should redeliver an event that matched no saved email yet. */
function shouldRedeliverUnmatched(event: ResendEmailEvent, now: Date): boolean {
  const kind = event.data?.tags?.notification;
  const createdAt = event.created_at ? Date.parse(event.created_at) : Number.NaN;

  // Test emails are never saved, so their events can't match.
  return (
    (kind === 'renewal_reminder' || kind === 'monthly_overview') &&
    Number.isFinite(createdAt) &&
    now.getTime() - createdAt < UNMATCHED_RETRY_WINDOW_MS
  );
}

/** Later statuses outrank earlier ones, so out-of-order events can't regress an email's state. */
const STATUS_RANK: Record<EmailDeliveryStatus, number> = {
  accepted: 0,
  delayed: 1,
  delivered: 2,
  failed: 3,
  bounced: 3,
  suppressed: 3,
  complained: 4,
};

const REJECTION_MESSAGES: Partial<Record<EmailDeliveryStatus, string>> = {
  bounced: 'Your email provider permanently rejected a notification email.',
  suppressed: 'Resend stopped sending to your address because earlier emails bounced or were marked as spam.',
  complained: 'A notification email was marked as spam.',
};

/** Maps a Resend event to a delivery status, or null for events that don't affect delivery. */
export function toEmailDeliveryStatus(event: ResendEmailEvent): EmailDeliveryStatus | null {
  switch (event.type) {
    case 'email.sent':
      return 'accepted';
    case 'email.delivery_delayed':
      return 'delayed';
    case 'email.delivered':
      return 'delivered';
    case 'email.bounced':
      // Only a permanent bounce rejects the address; a transient one may still deliver.
      return event.data?.bounce?.type === 'Permanent' ? 'bounced' : 'delayed';
    case 'email.complained':
      return 'complained';
    case 'email.suppressed':
      return 'suppressed';
    case 'email.failed':
      return 'failed';
    default:
      return null;
  }
}

/** `redeliver` asks Resend to send the event again later. */
export type ResendEventOutcome = 'duplicate' | 'ignored' | 'updated' | 'redeliver';

/**
 * Applies one verified Resend event to the email delivery it describes.
 * Redelivered events are ignored by their Svix message ID.
 */
export async function handleResendEvent(
  messageId: string,
  event: ResendEmailEvent,
  now: Date = new Date(),
): Promise<ResendEventOutcome> {
  return db.transaction(async (tx) => {
    const status = toEmailDeliveryStatus(event);
    const emailId = event.data?.email_id;
    const [delivery] =
      status && emailId
        ? await tx
            .select({
              id: notificationEventTable.id,
              destinationId: notificationEventTable.destinationId,
              emailStatus: notificationEventTable.emailStatus,
            })
            .from(notificationEventTable)
            .where(eq(notificationEventTable.providerMessageId, emailId))
            .limit(1)
            .for('update')
        : [];

    // Leave the event unrecorded so its redelivery is processed.
    if (status && !delivery && shouldRedeliverUnmatched(event, now)) {
      return 'redeliver';
    }

    const recorded = await tx
      .insert(resendWebhookEventTable)
      .values({ id: messageId, type: event.type })
      .onConflictDoNothing()
      .returning({ id: resendWebhookEventTable.id });

    if (recorded.length === 0) {
      return 'duplicate';
    }

    if (!status || !delivery) {
      return 'ignored';
    }

    if (delivery.emailStatus && STATUS_RANK[status] < STATUS_RANK[delivery.emailStatus]) {
      return 'ignored';
    }

    await tx
      .update(notificationEventTable)
      .set({ emailStatus: status, emailStatusAt: now })
      .where(eq(notificationEventTable.id, delivery.id));

    const rejection = REJECTION_MESSAGES[status];

    if (rejection) {
      // Stop emailing an address that permanently rejects mail. Other
      // destinations keep working.
      await tx
        .update(notificationDestinationTable)
        .set({
          pausedAt: now,
          pauseReason: 'recipient_rejected',
          pauseMessage: rejection,
          lastFailureAt: now,
          lastFailureMessage: rejection,
        })
        .where(eq(notificationDestinationTable.id, delivery.destinationId));
    } else if (status === 'failed') {
      await tx
        .update(notificationDestinationTable)
        .set({ lastFailureAt: now, lastFailureMessage: 'Resend couldn’t deliver a notification email.' })
        .where(eq(notificationDestinationTable.id, delivery.destinationId));
    }

    return 'updated';
  });
}
