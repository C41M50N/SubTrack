import { eq, isNull, min } from 'drizzle-orm';

import { getEmailAvailability } from '@/features/notifications/resend';
import { getDueOverviewPeriod, getDueReminderSlot } from '@/features/notifications/time';
import { db } from '@/lib/db';
import { user } from '@/lib/db/auth-schema';
import {
  notificationDestinationTable,
  notificationEventTable,
  notificationRouteTable,
  notificationSettingsTable,
  type NotificationKind,
} from '@/lib/db/notification-schema';

/** The period of `kind` whose 9 a.m. send is due at `now`, if any. */
function getDuePeriod(kind: NotificationKind, now: Date, timeZone: string) {
  if (kind === 'renewal_reminder') {
    const slot = getDueReminderSlot(now, timeZone);

    return { periodKey: slot.date, scheduledFor: slot.scheduledFor };
  }

  const period = getDueOverviewPeriod(now, timeZone);

  return period ? { periodKey: period.month, scheduledFor: period.scheduledFor } : null;
}

/**
 * Creates the notification events that are due at `now`: today's (or, before
 * 9 a.m., yesterday's) grouped reminder and, during local days 1–7, the
 * month's overview, for every active destination with a route.
 *
 * Each event is unique per destination and period, so reruns and concurrent
 * runs never create a second one. Events start empty; their content is built
 * right before each attempt.
 */
export async function scheduleDueNotifications(options: { now?: Date } = {}): Promise<{ created: number }> {
  const now = options.now ?? new Date();

  const routed = await db
    .select({
      userId: notificationDestinationTable.userId,
      destinationId: notificationDestinationTable.id,
      type: notificationDestinationTable.type,
      kind: notificationRouteTable.kind,
      firstRoutedAt: min(notificationRouteTable.createdAt),
      timeZone: notificationSettingsTable.timeZone,
      timingChangedAt: notificationSettingsTable.timingChangedAt,
      emailVerified: user.emailVerified,
    })
    .from(notificationRouteTable)
    .innerJoin(notificationDestinationTable, eq(notificationDestinationTable.id, notificationRouteTable.destinationId))
    .innerJoin(notificationSettingsTable, eq(notificationSettingsTable.userId, notificationDestinationTable.userId))
    .innerJoin(user, eq(user.id, notificationDestinationTable.userId))
    .where(isNull(notificationDestinationTable.pausedAt))
    .groupBy(notificationDestinationTable.id, notificationRouteTable.kind, notificationSettingsTable.userId, user.id);

  const emailAvailable = routed.some((row) => row.type === 'email') ? (await getEmailAvailability()).available : false;

  const events: (typeof notificationEventTable.$inferInsert)[] = [];

  for (const row of routed) {
    if (row.type === 'email' && (!emailAvailable || !row.emailVerified)) {
      continue;
    }

    const slot = getDuePeriod(row.kind, now, row.timeZone);

    // Nothing can be due when no route existed at the send time, or, for
    // reminders, when the user's timing changed after it.
    if (
      !slot ||
      !row.firstRoutedAt ||
      row.firstRoutedAt > slot.scheduledFor ||
      (row.kind === 'renewal_reminder' && row.timingChangedAt > slot.scheduledFor)
    ) {
      continue;
    }

    events.push({
      userId: row.userId,
      destinationId: row.destinationId,
      kind: row.kind,
      periodKey: slot.periodKey,
      scheduledFor: slot.scheduledFor,
      timeZone: row.timeZone,
      status: 'pending',
      nextAttemptAt: now,
    });
  }

  if (events.length === 0) {
    return { created: 0 };
  }

  const created = await db
    .insert(notificationEventTable)
    .values(events)
    .onConflictDoNothing({
      target: [notificationEventTable.destinationId, notificationEventTable.kind, notificationEventTable.periodKey],
    })
    .returning({ id: notificationEventTable.id });

  return { created: created.length };
}
