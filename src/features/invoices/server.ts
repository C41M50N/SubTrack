import { and, desc, eq } from 'drizzle-orm';

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
      name: subscription.name,
      iconRef: subscription.iconRef,
      category: subscription.category,
      amount: subscription.costAmount,
      invoiceDate: subscription.nextInvoiceDate,
    })
    .returning();

  return invoice;
}
