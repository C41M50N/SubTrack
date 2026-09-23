import { and, asc, desc, eq, gte, lt } from 'drizzle-orm';

import { getSubscriptionFilter } from '@/features/subscriptions/server';
import { db } from '@/lib/db';
import { categoryTable } from '@/lib/db/category-schema';
import { subscriptionInvoiceTable } from '@/lib/db/invoice-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';

export type SubscriptionInvoice = typeof subscriptionInvoiceTable.$inferSelect;

export async function listMyInvoices(userId: string) {
  return db
    .select()
    .from(subscriptionInvoiceTable)
    .where(eq(subscriptionInvoiceTable.userId, userId))
    .orderBy(desc(subscriptionInvoiceTable.invoiceDate));
}

export async function listMyInvoicesByCollection(
  userId: string,
  input: { collectionId: string; startDate: string; endDate: string },
) {
  return db
    .select()
    .from(subscriptionInvoiceTable)
    .where(
      and(
        eq(subscriptionInvoiceTable.userId, userId),
        eq(subscriptionInvoiceTable.collectionId, input.collectionId),
        gte(subscriptionInvoiceTable.invoiceDate, input.startDate),
        lt(subscriptionInvoiceTable.invoiceDate, input.endDate),
      ),
    )
    .orderBy(
      desc(subscriptionInvoiceTable.invoiceDate),
      desc(subscriptionInvoiceTable.amount),
      asc(subscriptionInvoiceTable.name),
      asc(subscriptionInvoiceTable.id),
    );
}

export async function listMyInvoicesBySubscription(userId: string, subscriptionId: string) {
  return db
    .select()
    .from(subscriptionInvoiceTable)
    .where(
      and(eq(subscriptionInvoiceTable.userId, userId), eq(subscriptionInvoiceTable.subscriptionId, subscriptionId)),
    )
    .orderBy(desc(subscriptionInvoiceTable.invoiceDate));
}

export async function createSubscriptionInvoice(input: { userId: string; subscriptionId: string }) {
  return db.transaction(async (tx) => {
    const [subscription] = await tx
      .select({ subscription: subscriptionTable, category: categoryTable.name })
      .from(subscriptionTable)
      .leftJoin(categoryTable, eq(subscriptionTable.categoryId, categoryTable.id))
      .where(getSubscriptionFilter(input.userId, input.subscriptionId))
      .limit(1)
      .for('update', { of: subscriptionTable });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.subscription.status !== 'active') {
      throw new Error('Inactive subscriptions cannot record invoices');
    }

    const [invoice] = await tx
      .insert(subscriptionInvoiceTable)
      .values({
        userId: subscription.subscription.userId,
        subscriptionId: subscription.subscription.id,
        collectionId: subscription.subscription.collectionId,
        name: subscription.subscription.name,
        iconRef: subscription.subscription.iconRef,
        category: subscription.category ?? 'Uncategorized',
        amount: subscription.subscription.costAmount,
        invoiceDate: subscription.subscription.nextInvoiceDate,
      })
      .returning();

    return invoice;
  });
}
