import { and, asc, desc, eq, getTableColumns, sql } from 'drizzle-orm';

import { assertCategoryInCollection } from '@/features/categories/server';
import { getMyCollection } from '@/features/collections/server';
import type { SubscriptionImportRow } from '@/features/subscriptions/schema';
import { db } from '@/lib/db';
import { categoryTable } from '@/lib/db/category-schema';
import { collectionTable } from '@/lib/db/collection-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';

export type Subscription = typeof subscriptionTable.$inferSelect;
export type SubscriptionStatus = Subscription['status'];
export type SubscriptionCostFrequency = Subscription['costFrequency'];
// A subscription row as returned by reads: table columns plus the resolved
// category name (null when Uncategorized).
export type SubscriptionListItem = Subscription & { category: string | null };

// Subscription rows are always read with the resolved category name joined in,
// so consumers get both the `categoryId` link and a display-ready `category`.
const subscriptionSelection = {
  ...getTableColumns(subscriptionTable),
  category: categoryTable.name,
};

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
    .select(subscriptionSelection)
    .from(subscriptionTable)
    .leftJoin(categoryTable, eq(subscriptionTable.categoryId, categoryTable.id))
    .where(and(...conditions))
    .orderBy(asc(subscriptionTable.nextInvoiceDate));
}

export async function getMySubscription(userId: string, subscriptionId: string) {
  const [subscription] = await db
    .select(subscriptionSelection)
    .from(subscriptionTable)
    .leftJoin(categoryTable, eq(subscriptionTable.categoryId, categoryTable.id))
    .where(getSubscriptionFilter(userId, subscriptionId))
    .limit(1);

  return subscription ?? null;
}

export async function createMySubscription(input: {
  userId: string;
  name: string;
  collectionId: string;
  iconRef: string;
  categoryId?: string | null;
  costAmount: number;
  costFrequency: SubscriptionCostFrequency;
  nextInvoiceDate: string;
  status?: SubscriptionStatus;
}) {
  await assertCollectionOwnership(input.userId, input.collectionId);

  if (input.categoryId) {
    await assertCategoryInCollection(input.userId, input.collectionId, input.categoryId);
  }

  const [subscription] = await db
    .insert(subscriptionTable)
    .values({
      userId: input.userId,
      name: input.name,
      collectionId: input.collectionId,
      iconRef: input.iconRef,
      categoryId: input.categoryId ?? null,
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
  categoryId?: string | null;
  costAmount?: number;
  costFrequency?: SubscriptionCostFrequency;
  nextInvoiceDate?: string;
  status?: SubscriptionStatus;
}) {
  if (input.collectionId) {
    await assertCollectionOwnership(input.userId, input.collectionId);
  }

  // A non-null category must belong to the subscription's (possibly new) collection.
  if (input.categoryId) {
    const collectionId =
      input.collectionId ?? (await getMySubscription(input.userId, input.subscriptionId))?.collectionId;

    if (!collectionId) {
      throw new Error('Subscription not found');
    }

    await assertCategoryInCollection(input.userId, collectionId, input.categoryId);
  }

  const values = {
    name: input.name,
    collectionId: input.collectionId,
    iconRef: input.iconRef,
    categoryId: input.categoryId,
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
    // Categories are collection-scoped, so the old category can't follow the
    // subscription into its new collection. Reset it to Uncategorized.
    .set({ collectionId: input.collectionId, categoryId: null })
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

    // Categories are unique per collection (case-insensitive), so key the cache
    // by collection id + lowercased name. Reuse an existing category or create it.
    const categoryIdByKey = new Map<string, string>();

    async function resolveCategoryId(collectionId: string, name: string): Promise<string> {
      const key = `${collectionId}:${name.toLowerCase()}`;
      const cached = categoryIdByKey.get(key);

      if (cached) {
        return cached;
      }

      const [existing] = await tx
        .select({ id: categoryTable.id })
        .from(categoryTable)
        .where(
          and(
            eq(categoryTable.userId, input.userId),
            eq(categoryTable.collectionId, collectionId),
            sql`lower(${categoryTable.name}) = ${name.toLowerCase()}`,
          ),
        )
        .limit(1);

      if (existing) {
        categoryIdByKey.set(key, existing.id);
        return existing.id;
      }

      const [created] = await tx
        .insert(categoryTable)
        .values({ userId: input.userId, collectionId, name })
        .returning({ id: categoryTable.id });

      categoryIdByKey.set(key, created.id);
      return created.id;
    }

    if (input.rows.length > 0) {
      const values = [];

      for (const row of input.rows) {
        const collectionId = collectionIdByName.get(row.collection.toLowerCase());

        if (!collectionId) {
          throw new Error('Failed to resolve collection during import');
        }

        values.push({
          userId: input.userId,
          name: row.name,
          status: row.status,
          iconRef: row.iconRef,
          categoryId: await resolveCategoryId(collectionId, row.category),
          costAmount: row.costAmountCents,
          costFrequency: row.costFrequency,
          nextInvoiceDate: row.nextInvoiceDate,
          collectionId,
        });
      }

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
