import { and, asc, desc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';

import { toCategoryNameKey } from '@/features/categories/names';
import { assertCategoryInCollection, findOrCreateCategoriesByName } from '@/features/categories/server';
import { getMyCollection } from '@/features/collections/server';
import { getImportedDeactivatedAt } from '@/features/subscriptions/import';
import type { SubscriptionImportRow } from '@/features/subscriptions/schema';
import { buildSeedSubscriptions } from '@/features/subscriptions/seed-data';
import { getNextInvoiceDateOnOrAfter } from '@/jobs/invoice-schedule';
import { db } from '@/lib/db';
import { categoryTable } from '@/lib/db/category-schema';
import { collectionTable } from '@/lib/db/collection-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';
import { UserFacingError } from '@/lib/errors';

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

  return db.transaction(async (tx) => {
    const [subscription] = await tx
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
  });
}

export async function importMySubscriptions(input: { userId: string; rows: SubscriptionImportRow[] }) {
  return db.transaction(async (tx) => {
    const importedAt = new Date();
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

    const rowsWithCollection = input.rows.map((row) => {
      const collectionId = collectionIdByName.get(row.collection.toLowerCase());

      if (!collectionId) {
        throw new Error('Failed to resolve collection during import');
      }

      return { row, collectionId };
    });

    // Categories are collection-scoped, so resolve each collection's category
    // names together, reusing existing categories or creating them.
    const categoryNamesByCollectionId = new Map<string, string[]>();

    for (const { row, collectionId } of rowsWithCollection) {
      const names = categoryNamesByCollectionId.get(collectionId) ?? [];
      names.push(row.category);
      categoryNamesByCollectionId.set(collectionId, names);
    }

    const categoryIdByKeyByCollectionId = new Map<string, Map<string, string>>();

    for (const [collectionId, names] of categoryNamesByCollectionId) {
      const { categoryIdByKey } = await findOrCreateCategoriesByName(tx, { userId: input.userId, collectionId, names });
      categoryIdByKeyByCollectionId.set(collectionId, categoryIdByKey);
    }

    const values = rowsWithCollection.map(({ row, collectionId }) => {
      const categoryId = categoryIdByKeyByCollectionId.get(collectionId)?.get(toCategoryNameKey(row.category));

      if (!categoryId) {
        throw new Error('Failed to resolve category during import');
      }

      return {
        userId: input.userId,
        name: row.name,
        status: row.status,
        iconRef: row.iconRef,
        categoryId,
        costAmount: row.costAmountCents,
        costFrequency: row.costFrequency,
        nextInvoiceDate: row.nextInvoiceDate,
        deactivatedAt: getImportedDeactivatedAt(row, importedAt),
        collectionId,
      };
    });

    if (values.length > 0) {
      await tx.insert(subscriptionTable).values(values);
    }

    return {
      collectionsCreated,
      subscriptionsImported: input.rows.length,
    };
  });
}

// Dev-only seeding: replace all subscriptions in a collection with a fixed sample
// set (invoice dates are generated per run). Destructive and transactional so a
// failure leaves the collection untouched.
export async function seedMySubscriptions(input: { userId: string; collectionId: string }) {
  await assertCollectionOwnership(input.userId, input.collectionId);

  const rows = buildSeedSubscriptions();

  return db.transaction(async (tx) => {
    const deleted = await tx
      .delete(subscriptionTable)
      .where(and(eq(subscriptionTable.userId, input.userId), eq(subscriptionTable.collectionId, input.collectionId)))
      .returning({ id: subscriptionTable.id });

    // Categories are collection-scoped; reuse existing ones or create them.
    const { categoryIdByKey } = await findOrCreateCategoriesByName(tx, {
      userId: input.userId,
      collectionId: input.collectionId,
      names: rows.map((row) => row.category),
    });

    const values = [];

    for (const row of rows) {
      const categoryId = categoryIdByKey.get(toCategoryNameKey(row.category));

      if (!categoryId) {
        throw new Error('Failed to resolve category during seeding');
      }

      values.push({
        userId: input.userId,
        name: row.name,
        status: row.status,
        iconRef: row.iconRef,
        categoryId,
        costAmount: row.costAmountCents,
        costFrequency: row.costFrequency,
        nextInvoiceDate: row.nextInvoiceDate,
        collectionId: input.collectionId,
      });
    }

    await tx.insert(subscriptionTable).values(values);

    return {
      subscriptionsDeleted: deleted.length,
      subscriptionsSeeded: rows.length,
    };
  });
}

// Dev-only: remove every subscription in a collection.
export async function clearMySubscriptions(input: { userId: string; collectionId: string }) {
  await assertCollectionOwnership(input.userId, input.collectionId);

  const deleted = await db
    .delete(subscriptionTable)
    .where(and(eq(subscriptionTable.userId, input.userId), eq(subscriptionTable.collectionId, input.collectionId)))
    .returning({ id: subscriptionTable.id });

  return { subscriptionsDeleted: deleted.length };
}

function assertEverySubscriptionFound(foundCount: number, expectedCount: number) {
  if (foundCount !== expectedCount) {
    throw new UserFacingError('Subscriptions changed. Refresh and try again.');
  }
}

export async function deactivateMySubscriptions(input: { userId: string; subscriptionIds: string[] }) {
  return db.transaction(async (tx) => {
    const subscriptions = await tx
      .select({ id: subscriptionTable.id })
      .from(subscriptionTable)
      .where(
        and(
          eq(subscriptionTable.userId, input.userId),
          eq(subscriptionTable.status, 'active'),
          inArray(subscriptionTable.id, input.subscriptionIds),
        ),
      )
      .for('update');

    assertEverySubscriptionFound(subscriptions.length, input.subscriptionIds.length);

    const deactivatedAt = new Date();
    const updated = await tx
      .update(subscriptionTable)
      .set({ status: 'inactive', deactivatedAt })
      .where(
        and(
          eq(subscriptionTable.userId, input.userId),
          eq(subscriptionTable.status, 'active'),
          inArray(subscriptionTable.id, input.subscriptionIds),
        ),
      )
      .returning();

    assertEverySubscriptionFound(updated.length, input.subscriptionIds.length);

    return { subscriptions: updated, deactivatedAt };
  });
}

export async function reactivateMySubscriptions(input: {
  userId: string;
  subscriptionIds: string[];
  nextInvoiceDate?: string;
}) {
  if (input.nextInvoiceDate && input.subscriptionIds.length !== 1) {
    throw new Error('A custom invoice date can only be used for one subscription');
  }

  return db.transaction(async (tx) => {
    const clock = await tx.execute<{ processingDate: string }>(sql`select current_date as "processingDate"`);
    const processingDate = clock.rows[0]?.processingDate;

    if (!processingDate) {
      throw new Error('Could not read the database date');
    }

    if (input.nextInvoiceDate && input.nextInvoiceDate < processingDate) {
      throw new UserFacingError('Next invoice date must be today or later');
    }

    const subscriptions = await tx
      .select({
        id: subscriptionTable.id,
        costFrequency: subscriptionTable.costFrequency,
        nextInvoiceDate: subscriptionTable.nextInvoiceDate,
      })
      .from(subscriptionTable)
      .where(
        and(
          eq(subscriptionTable.userId, input.userId),
          eq(subscriptionTable.status, 'inactive'),
          inArray(subscriptionTable.id, input.subscriptionIds),
        ),
      )
      .for('update');

    assertEverySubscriptionFound(subscriptions.length, input.subscriptionIds.length);

    const nextInvoiceDateCases = subscriptions.map((subscription) => {
      const nextInvoiceDate =
        input.nextInvoiceDate ??
        getNextInvoiceDateOnOrAfter(subscription.nextInvoiceDate, subscription.costFrequency, processingDate);

      return sql`when ${subscription.id} then ${nextInvoiceDate}::date`;
    });
    const nextInvoiceDate = sql<string>`case ${subscriptionTable.id} ${sql.join(nextInvoiceDateCases, sql.raw(' '))} end`;
    const updated = await tx
      .update(subscriptionTable)
      .set({ status: 'active', deactivatedAt: null, nextInvoiceDate })
      .where(
        and(
          eq(subscriptionTable.userId, input.userId),
          eq(subscriptionTable.status, 'inactive'),
          inArray(subscriptionTable.id, input.subscriptionIds),
        ),
      )
      .returning();

    assertEverySubscriptionFound(updated.length, input.subscriptionIds.length);
    return updated;
  });
}

export async function undoMyDeactivation(input: { userId: string; subscriptionIds: string[]; deactivatedAt: Date }) {
  return db.transaction(async (tx) => {
    const subscriptions = await tx
      .select({ id: subscriptionTable.id })
      .from(subscriptionTable)
      .where(
        and(
          eq(subscriptionTable.userId, input.userId),
          eq(subscriptionTable.status, 'inactive'),
          eq(subscriptionTable.deactivatedAt, input.deactivatedAt),
          inArray(subscriptionTable.id, input.subscriptionIds),
        ),
      )
      .for('update');

    assertEverySubscriptionFound(subscriptions.length, input.subscriptionIds.length);

    const updated = await tx
      .update(subscriptionTable)
      .set({ status: 'active', deactivatedAt: null })
      .where(
        and(
          eq(subscriptionTable.userId, input.userId),
          eq(subscriptionTable.status, 'inactive'),
          eq(subscriptionTable.deactivatedAt, input.deactivatedAt),
          inArray(subscriptionTable.id, input.subscriptionIds),
        ),
      )
      .returning();

    assertEverySubscriptionFound(updated.length, input.subscriptionIds.length);
    return updated;
  });
}

export async function deleteMySubscriptions(input: { userId: string; subscriptionIds: string[] }) {
  return db.transaction(async (tx) => {
    const subscriptions = await tx
      .select({ id: subscriptionTable.id })
      .from(subscriptionTable)
      .where(and(eq(subscriptionTable.userId, input.userId), inArray(subscriptionTable.id, input.subscriptionIds)))
      .for('update');

    assertEverySubscriptionFound(subscriptions.length, input.subscriptionIds.length);

    const deleted = await tx
      .delete(subscriptionTable)
      .where(and(eq(subscriptionTable.userId, input.userId), inArray(subscriptionTable.id, input.subscriptionIds)))
      .returning();

    assertEverySubscriptionFound(deleted.length, input.subscriptionIds.length);
    return deleted;
  });
}
