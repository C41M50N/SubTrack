import { and, eq, gte, inArray, lt, lte } from 'drizzle-orm';

import {
  buildOverviewContent,
  buildReminderContent,
  type NotificationContent,
  type NotificationMeta,
} from '@/features/notifications/content';
import { buildOverviewItems, listDueReminderOccurrences } from '@/features/notifications/schedule';
import { getOverviewPeriod, isOverviewSendable } from '@/features/notifications/time';
import { recordDueInvoices } from '@/jobs/due-invoices';
import { db, type DbTransaction } from '@/lib/db';
import { categoryTable } from '@/lib/db/category-schema';
import { collectionTable } from '@/lib/db/collection-schema';
import { subscriptionInvoiceTable } from '@/lib/db/invoice-schema';
import {
  notificationReminderClaimTable,
  notificationRouteTable,
  notificationSettingsTable,
  type NotificationKind,
} from '@/lib/db/notification-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';

export type BuildableEvent = {
  id: string;
  userId: string;
  destinationId: string;
  kind: NotificationKind;
  periodKey: string;
  scheduledFor: Date;
};

export type BuildResult = { content: NotificationContent } | { content: null; reason: string };

async function getCollectionNames(tx: DbTransaction, userId: string, collectionIds: string[]) {
  if (collectionIds.length === 0) {
    return new Map<string, string>();
  }

  const rows = await tx
    .select({ id: collectionTable.id, name: collectionTable.name })
    .from(collectionTable)
    .where(and(eq(collectionTable.userId, userId), inArray(collectionTable.id, collectionIds)));

  return new Map(rows.map((row) => [row.id, row.name]));
}

/** Releases the reminder occurrences an event was carrying, so a later reminder may include them. */
export async function releaseReminderClaims(executor: typeof db | DbTransaction, eventId: string) {
  await executor.delete(notificationReminderClaimTable).where(eq(notificationReminderClaimTable.eventId, eventId));
}

async function buildReminder(
  tx: DbTransaction,
  event: BuildableEvent,
  settings: typeof notificationSettingsTable.$inferSelect,
  meta: NotificationMeta,
  now: Date,
): Promise<BuildResult> {
  const routes = await tx
    .select({ collectionId: notificationRouteTable.collectionId, createdAt: notificationRouteTable.createdAt })
    .from(notificationRouteTable)
    .where(
      and(
        eq(notificationRouteTable.userId, event.userId),
        eq(notificationRouteTable.destinationId, event.destinationId),
        eq(notificationRouteTable.kind, 'renewal_reminder'),
      ),
    );

  if (routes.length === 0) {
    return { content: null, reason: 'No collections send renewal reminders to this destination.' };
  }

  const subscriptions = await tx
    .select()
    .from(subscriptionTable)
    .where(
      and(
        eq(subscriptionTable.userId, event.userId),
        inArray(
          subscriptionTable.collectionId,
          routes.map((route) => route.collectionId),
        ),
        eq(subscriptionTable.status, 'active'),
        eq(subscriptionTable.notificationsIncluded, true),
      ),
    );

  const occurrences = listDueReminderOccurrences({
    subscriptions,
    routes,
    timing: {
      timeZone: settings.timeZone,
      leadDays: settings.reminderLeadDays,
      timingChangedAt: settings.timingChangedAt,
    },
    slotDate: event.periodKey,
    now,
  });

  // Rebuild this event's claims from scratch. An occurrence another event
  // already carries, or that a sent reminder already covered, is skipped.
  await releaseReminderClaims(tx, event.id);

  const claimed =
    occurrences.length > 0
      ? await tx
          .insert(notificationReminderClaimTable)
          .values(
            occurrences.map((occurrence) => ({
              destinationId: event.destinationId,
              subscriptionId: occurrence.subscriptionId,
              invoiceDate: occurrence.expectedDate,
              eventId: event.id,
            })),
          )
          .onConflictDoNothing()
          .returning({
            subscriptionId: notificationReminderClaimTable.subscriptionId,
            invoiceDate: notificationReminderClaimTable.invoiceDate,
          })
      : [];
  const claimedKeys = new Set(claimed.map((claim) => `${claim.subscriptionId}:${claim.invoiceDate}`));
  const items = occurrences.filter((occurrence) =>
    claimedKeys.has(`${occurrence.subscriptionId}:${occurrence.expectedDate}`),
  );

  if (items.length === 0) {
    return { content: null, reason: 'No renewals are eligible for this reminder.' };
  }

  return {
    content: buildReminderContent({
      meta,
      leadDays: settings.reminderLeadDays,
      items: items.map(({ reminderDate: _reminderDate, ...item }) => item),
      collectionNames: await getCollectionNames(
        tx,
        event.userId,
        items.map((item) => item.collectionId),
      ),
    }),
  };
}

async function buildOverview(
  tx: DbTransaction,
  event: BuildableEvent,
  settings: typeof notificationSettingsTable.$inferSelect,
  meta: NotificationMeta,
): Promise<BuildResult> {
  const period = getOverviewPeriod(event.periodKey, settings.timeZone);

  // Only collections routed before the scheduled send are included; turning
  // a route on later doesn't replay this month's overview.
  const routes = await tx
    .select({ collectionId: notificationRouteTable.collectionId })
    .from(notificationRouteTable)
    .where(
      and(
        eq(notificationRouteTable.userId, event.userId),
        eq(notificationRouteTable.destinationId, event.destinationId),
        eq(notificationRouteTable.kind, 'monthly_overview'),
        lte(notificationRouteTable.createdAt, period.scheduledFor),
      ),
    );

  if (routes.length === 0) {
    return { content: null, reason: 'No collections send monthly overviews to this destination.' };
  }

  const collectionIds = new Set(routes.map((route) => route.collectionId));

  // All of the user's invoices in both months: a subscription that moved can
  // have an occurrence recorded in another collection that mustn't be
  // projected again.
  const invoices = await tx
    .select()
    .from(subscriptionInvoiceTable)
    .where(
      and(
        eq(subscriptionInvoiceTable.userId, event.userId),
        gte(subscriptionInvoiceTable.invoiceDate, period.previousStartDate),
        lt(subscriptionInvoiceTable.invoiceDate, period.endDate),
      ),
    );

  const subscriptions = await tx
    .select({
      id: subscriptionTable.id,
      collectionId: subscriptionTable.collectionId,
      name: subscriptionTable.name,
      iconRef: subscriptionTable.iconRef,
      category: categoryTable.name,
      status: subscriptionTable.status,
      notificationsIncluded: subscriptionTable.notificationsIncluded,
      costAmount: subscriptionTable.costAmount,
      costFrequency: subscriptionTable.costFrequency,
      nextInvoiceDate: subscriptionTable.nextInvoiceDate,
    })
    .from(subscriptionTable)
    .leftJoin(categoryTable, eq(subscriptionTable.categoryId, categoryTable.id))
    .where(
      and(
        eq(subscriptionTable.userId, event.userId),
        inArray(subscriptionTable.collectionId, [...collectionIds]),
        eq(subscriptionTable.status, 'active'),
      ),
    );

  const { previousItems, newMonthItems } = buildOverviewItems({ period, collectionIds, invoices, subscriptions });

  if (previousItems.length === 0 && newMonthItems.length === 0) {
    return { content: null, reason: 'Both months are empty for the routed collections.' };
  }

  return {
    content: buildOverviewContent({
      meta,
      month: period.month,
      previousMonth: period.previousMonth,
      previousItems,
      newMonthItems,
      collectionNames: await getCollectionNames(tx, event.userId, [
        ...new Set([...previousItems, ...newMonthItems].map((item) => item.collectionId)),
      ]),
    }),
  };
}

/**
 * Builds an event's content from the current settings, routes, inclusion
 * choices, and schedules. Runs before every attempt so nothing that became
 * ineligible since the last attempt is sent.
 */
export async function buildEventContent(event: BuildableEvent, now: Date): Promise<BuildResult> {
  const [settings] = await db
    .select()
    .from(notificationSettingsTable)
    .where(eq(notificationSettingsTable.userId, event.userId))
    .limit(1);

  if (!settings) {
    return { content: null, reason: 'Notification settings were removed.' };
  }

  if (event.kind === 'monthly_overview') {
    if (!isOverviewSendable(event.periodKey, now, settings.timeZone)) {
      return { content: null, reason: 'The overview’s send window has closed.' };
    }

    // The previous month must be fully recorded before it's summarized.
    await recordDueInvoices({ now, userId: event.userId });
  }

  const meta: NotificationMeta = {
    eventId: event.id,
    test: false,
    timeZone: settings.timeZone,
    scheduledFor: event.scheduledFor,
    localDate: event.kind === 'monthly_overview' ? `${event.periodKey}-01` : event.periodKey,
  };

  return db.transaction((tx) =>
    event.kind === 'renewal_reminder'
      ? buildReminder(tx, event, settings, meta, now)
      : buildOverview(tx, event, settings, meta),
  );
}
