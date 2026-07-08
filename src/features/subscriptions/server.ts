import { and, asc, desc, eq, sql } from 'drizzle-orm';

import { getMyCollection } from '@/features/collections/server';
import type { SubscriptionImportRow } from '@/features/subscriptions/schema';
import { db } from '@/lib/db';
import { collectionTable } from '@/lib/db/collection-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';

export type Subscription = typeof subscriptionTable.$inferSelect;
export type SubscriptionStatus = Subscription['status'];
export type SubscriptionCostFrequency = Subscription['costFrequency'];

export function getSubscriptionFilter(userId: string, subscriptionId: string) {
  return and(eq(subscriptionTable.userId, userId), eq(subscriptionTable.id, subscriptionId));
}

async function assertCollectionOwnership(userId: string, collectionId: string) {
  const collection = await getMyCollection(userId, collectionId);

  if (!collection) {
    throw new Error('Collection not found');
  }
}

export async function listMySubscriptions(
  userId: string,
  filters?: { collectionId?: string; status?: SubscriptionStatus },
) {
  const conditions = [eq(subscriptionTable.userId, userId)];

  if (filters?.collectionId) {
    conditions.push(eq(subscriptionTable.collectionId, filters.collectionId));
  }

  if (filters?.status) {
    conditions.push(eq(subscriptionTable.status, filters.status));
  }

  return db
    .select()
    .from(subscriptionTable)
    .where(and(...conditions))
    .orderBy(asc(subscriptionTable.nextInvoiceDate));
}

export async function getMySubscription(userId: string, subscriptionId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptionTable)
    .where(getSubscriptionFilter(userId, subscriptionId))
    .limit(1);

  return subscription ?? null;
}

export async function createMySubscription(input: {
  userId: string;
  name: string;
  collectionId: string;
  iconRef: string;
  category: string;
  costAmount: number;
  costFrequency: SubscriptionCostFrequency;
  nextInvoiceDate: string;
  status?: SubscriptionStatus;
}) {
  await assertCollectionOwnership(input.userId, input.collectionId);

  const [subscription] = await db
    .insert(subscriptionTable)
    .values({
      userId: input.userId,
      name: input.name,
      collectionId: input.collectionId,
      iconRef: input.iconRef,
      category: input.category,
      costAmount: input.costAmount,
      costFrequency: input.costFrequency,
      nextInvoiceDate: input.nextInvoiceDate,
      status: input.status ?? 'active',
    })
    .returning();

  return subscription;
}

export async function updateMySubscription(input: {
  userId: string;
  subscriptionId: string;
  name?: string;
  collectionId?: string;
  iconRef?: string;
  category?: string;
  costAmount?: number;
  costFrequency?: SubscriptionCostFrequency;
  nextInvoiceDate?: string;
  status?: SubscriptionStatus;
}) {
  if (input.collectionId) {
    await assertCollectionOwnership(input.userId, input.collectionId);
  }

  const values = {
    name: input.name,
    collectionId: input.collectionId,
    iconRef: input.iconRef,
    category: input.category,
    costAmount: input.costAmount,
    costFrequency: input.costFrequency,
    nextInvoiceDate: input.nextInvoiceDate,
    status: input.status,
  };

  const [subscription] = await db
    .update(subscriptionTable)
    .set(values)
    .where(getSubscriptionFilter(input.userId, input.subscriptionId))
    .returning();

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  return subscription;
}

export async function moveMySubscription(input: { userId: string; subscriptionId: string; collectionId: string }) {
  await assertCollectionOwnership(input.userId, input.collectionId);

  const [subscription] = await db
    .update(subscriptionTable)
    .set({ collectionId: input.collectionId })
    .where(getSubscriptionFilter(input.userId, input.subscriptionId))
    .returning();

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  return subscription;
}

export async function importMySubscriptions(input: { userId: string; rows: SubscriptionImportRow[] }) {
  return db.transaction(async (tx) => {
    // Collection names are unique per user case-insensitively, so key the cache
    // and existing-name lookups by the lowercased name.
    const collectionIdByName = new Map<string, string>();
    let collectionsCreated = 0;

    for (const row of input.rows) {
      const nameKey = row.collection.toLowerCase();

      if (collectionIdByName.has(nameKey)) {
        continue;
      }

      const [existing] = await tx
        .select({ id: collectionTable.id })
        .from(collectionTable)
        .where(and(eq(collectionTable.userId, input.userId), sql`lower(${collectionTable.name}) = ${nameKey}`))
        .orderBy(desc(collectionTable.updatedAt))
        .limit(1);

      if (existing) {
        collectionIdByName.set(nameKey, existing.id);
        continue;
      }

      const [created] = await tx
        .insert(collectionTable)
        .values({ userId: input.userId, name: row.collection })
        .returning({ id: collectionTable.id });

      collectionIdByName.set(nameKey, created.id);
      collectionsCreated += 1;
    }

    if (input.rows.length > 0) {
      const values = input.rows.map((row) => {
        const collectionId = collectionIdByName.get(row.collection.toLowerCase());

        if (!collectionId) {
          throw new Error('Failed to resolve collection during import');
        }

        return {
          userId: input.userId,
          name: row.name,
          status: row.status,
          iconRef: row.iconRef,
          category: row.category,
          costAmount: row.costAmountCents,
          costFrequency: row.costFrequency,
          nextInvoiceDate: row.nextInvoiceDate,
          collectionId,
        };
      });

      await tx.insert(subscriptionTable).values(values);
    }

    return {
      collectionsCreated,
      subscriptionsImported: input.rows.length,
    };
  });
}

export async function deleteMySubscription(input: { userId: string; subscriptionId: string }) {
  const [subscription] = await db
    .delete(subscriptionTable)
    .where(getSubscriptionFilter(input.userId, input.subscriptionId))
    .returning();

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  return subscription;
}
