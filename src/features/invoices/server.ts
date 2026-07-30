import { and, asc, desc, eq, gte, lt } from 'drizzle-orm';

import { getMySubscription } from '@/features/subscriptions/server';
import { db } from '@/lib/db';
import { subscriptionInvoiceTable } from '@/lib/db/invoice-schema';

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
  const subscription = await getMySubscription(input.userId, input.subscriptionId);

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const [invoice] = await db
    .insert(subscriptionInvoiceTable)
    .values({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      collectionId: subscription.collectionId,
      name: subscription.name,
      iconRef: subscription.iconRef,
      category: subscription.category ?? 'Uncategorized',
      amount: subscription.costAmount,
      invoiceDate: subscription.nextInvoiceDate,
    })
    .returning();

  return invoice;
}
