import { and, eq, getTableColumns, lte } from 'drizzle-orm';

import { addDaysToDateKey, FALLBACK_TIME_ZONE, toLocalDateKey } from '@/features/notifications/time';
import { buildDueInvoiceSchedule } from '@/jobs/invoice-schedule';
import { db } from '@/lib/db';
import { categoryTable } from '@/lib/db/category-schema';
import { subscriptionInvoiceTable } from '@/lib/db/invoice-schema';
import { notificationSettingsTable } from '@/lib/db/notification-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';

export type RecordDueInvoicesResult = {
  subscriptionsProcessed: number;
  invoicesCreated: number;
};

/**
 * Records an invoice snapshot for every scheduled charge that has come due, in
 * each user's own time zone, and advances the schedules past them. One shared
 * job covers every user; pass `userId` to process a single user on demand.
 */
export async function recordDueInvoices(
  options: { now?: Date; userId?: string } = {},
): Promise<RecordDueInvoicesResult> {
  const now = options.now ?? new Date();

  // No time zone is more than a day ahead of UTC, so this bounds every
  // user's local date.
  const latestLocalDate = addDaysToDateKey(toLocalDateKey(now, 'UTC'), 1);

  return db.transaction(async (tx) => {
    const candidates = await tx
      .select({
        ...getTableColumns(subscriptionTable),
        category: categoryTable.name,
        timeZone: notificationSettingsTable.timeZone,
      })
      .from(subscriptionTable)
      .leftJoin(categoryTable, eq(subscriptionTable.categoryId, categoryTable.id))
      .leftJoin(notificationSettingsTable, eq(notificationSettingsTable.userId, subscriptionTable.userId))
      .where(
        and(
          eq(subscriptionTable.status, 'active'),
          lte(subscriptionTable.nextInvoiceDate, latestLocalDate),
          options.userId ? eq(subscriptionTable.userId, options.userId) : undefined,
        ),
      )
      .for('update', { of: subscriptionTable });

    const invoices: (typeof subscriptionInvoiceTable.$inferInsert)[] = [];
    let subscriptionsProcessed = 0;

    for (const subscription of candidates) {
      const processingDate = toLocalDateKey(now, subscription.timeZone ?? FALLBACK_TIME_ZONE);
      const schedule = buildDueInvoiceSchedule(
        subscription.nextInvoiceDate,
        subscription.costFrequency,
        processingDate,
      );

      if (schedule.invoiceDates.length === 0) {
        continue;
      }

      subscriptionsProcessed += 1;

      for (const invoiceDate of schedule.invoiceDates) {
        invoices.push({
          userId: subscription.userId,
          subscriptionId: subscription.id,
          collectionId: subscription.collectionId,
          name: subscription.name,
          iconRef: subscription.iconRef,
          category: subscription.category ?? 'Uncategorized',
          amount: subscription.costAmount,
          invoiceDate,
          notificationsIncluded: subscription.notificationsIncluded,
        });
      }

      await tx
        .update(subscriptionTable)
        .set({ nextInvoiceDate: schedule.nextInvoiceDate })
        .where(eq(subscriptionTable.id, subscription.id));
    }

    const created =
      invoices.length > 0
        ? await tx
            .insert(subscriptionInvoiceTable)
            .values(invoices)
            .onConflictDoNothing()
            .returning({ id: subscriptionInvoiceTable.id })
        : [];

    return { subscriptionsProcessed, invoicesCreated: created.length };
  });
}
