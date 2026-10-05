import { and, inArray, lt } from 'drizzle-orm';

import { addDaysToDateKey, toLocalDateKey } from '@/features/notifications/time';
import { db } from '@/lib/db';
import {
  notificationEventTable,
  notificationReminderClaimTable,
  resendWebhookEventTable,
} from '@/lib/db/notification-schema';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Empty events only mark that a period was evaluated. */
const EMPTY_EVENT_RETENTION_DAYS = 30;

/** Sent and failed events back delivery health and debugging. */
const DELIVERED_EVENT_RETENTION_DAYS = 180;

/** Redelivered Resend events arrive within days, not weeks. */
const RESEND_EVENT_RETENTION_DAYS = 30;

/**
 * A claim only matters while its invoice date could still be reminded about,
 * so claims for long-past occurrences can go.
 */
const PAST_CLAIM_RETENTION_DAYS = 7;

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

export async function pruneNotificationHistory(options: { now?: Date } = {}) {
  const now = options.now ?? new Date();

  await db
    .delete(notificationEventTable)
    .where(
      and(
        inArray(notificationEventTable.status, ['skipped', 'cancelled']),
        lt(notificationEventTable.createdAt, daysAgo(now, EMPTY_EVENT_RETENTION_DAYS)),
      ),
    );

  await db
    .delete(notificationEventTable)
    .where(
      and(
        inArray(notificationEventTable.status, ['succeeded', 'failed']),
        lt(notificationEventTable.createdAt, daysAgo(now, DELIVERED_EVENT_RETENTION_DAYS)),
      ),
    );

  await db
    .delete(notificationReminderClaimTable)
    .where(
      lt(
        notificationReminderClaimTable.invoiceDate,
        addDaysToDateKey(toLocalDateKey(now, 'UTC'), -PAST_CLAIM_RETENTION_DAYS),
      ),
    );

  await db
    .delete(resendWebhookEventTable)
    .where(lt(resendWebhookEventTable.receivedAt, daysAgo(now, RESEND_EVENT_RETENTION_DAYS)));
}
