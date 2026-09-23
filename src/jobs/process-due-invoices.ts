import { and, eq, getTableColumns, lte, sql } from 'drizzle-orm';

import { buildDueInvoiceSchedule } from '@/jobs/invoice-schedule';
import { db } from '@/lib/db';
import { categoryTable } from '@/lib/db/category-schema';
import { subscriptionInvoiceTable } from '@/lib/db/invoice-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';

export type ProcessDueInvoicesResult = {
  processingDate: string;
  subscriptionsProcessed: number;
  invoicesCreated: number;
};

export async function processDueInvoices(): Promise<ProcessDueInvoicesResult> {
  return db.transaction(async (tx) => {
    const clock = await tx.execute<{ processingDate: string }>(sql`select current_date as "processingDate"`);
    const [clockRow] = clock.rows;

    if (!clockRow) {
      throw new Error('Could not read the database date');
    }

    const processingDate = clockRow.processingDate;

    const dueSubscriptions = await tx
      .select({
        ...getTableColumns(subscriptionTable),
        category: categoryTable.name,
      })
      .from(subscriptionTable)
      .leftJoin(categoryTable, eq(subscriptionTable.categoryId, categoryTable.id))
      .where(and(eq(subscriptionTable.status, 'active'), lte(subscriptionTable.nextInvoiceDate, processingDate)))
      .for('update', { of: subscriptionTable });

    const invoices: (typeof subscriptionInvoiceTable.$inferInsert)[] = [];

    for (const subscription of dueSubscriptions) {
      const schedule = buildDueInvoiceSchedule(
        subscription.nextInvoiceDate,
        subscription.costFrequency,
        processingDate,
      );

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
        });
      }

      await tx
        .update(subscriptionTable)
        .set({ nextInvoiceDate: schedule.nextInvoiceDate })
        .where(eq(subscriptionTable.id, subscription.id));
    }

    if (invoices.length > 0) {
      await tx.insert(subscriptionInvoiceTable).values(invoices);
    }

    return {
      processingDate,
      subscriptionsProcessed: dueSubscriptions.length,
      invoicesCreated: invoices.length,
    };
  });
}

const result = await processDueInvoices();

console.log(
  `Processed ${result.subscriptionsProcessed} subscriptions and created ${result.invoicesCreated} invoices through ${result.processingDate}.`,
);
