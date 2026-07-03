import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { collectionTable } from '@/lib/db/collection-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';

export type Collection = typeof collectionTable.$inferSelect;

export function getCollectionFilter(userId: string, collectionId: string) {
  return and(eq(collectionTable.userId, userId), eq(collectionTable.id, collectionId));
}

export async function listMyCollections(userId: string) {
  return db.select().from(collectionTable).where(eq(collectionTable.userId, userId)).orderBy(asc(collectionTable.name));
}

export async function getMyCollection(userId: string, collectionId: string) {
  const [collection] = await db
    .select()
    .from(collectionTable)
    .where(getCollectionFilter(userId, collectionId))
    .limit(1);

  return collection ?? null;
}

export async function createMyCollection(input: { userId: string; name: string }) {
  const [collection] = await db
    .insert(collectionTable)
    .values({
      userId: input.userId,
      name: input.name,
    })
    .returning();

  return collection;
}

export async function renameMyCollection(input: { userId: string; collectionId: string; name: string }) {
  const [collection] = await db
    .update(collectionTable)
    .set({
      name: input.name,
    })
    .where(getCollectionFilter(input.userId, input.collectionId))
    .returning();

  if (!collection) {
    throw new Error('Collection not found');
  }

  return collection;
}

export async function duplicateMyCollection(input: { userId: string; collectionId: string }) {
  return db.transaction(async (tx) => {
    const [original] = await tx
      .select()
      .from(collectionTable)
      .where(getCollectionFilter(input.userId, input.collectionId))
      .limit(1);

    if (!original) {
      throw new Error('Collection not found');
    }

    const [collection] = await tx
      .insert(collectionTable)
      .values({
        userId: input.userId,
        name: `${original.name} (copy)`,
      })
      .returning();

    const subscriptions = await tx
      .select()
      .from(subscriptionTable)
      .where(and(eq(subscriptionTable.userId, input.userId), eq(subscriptionTable.collectionId, input.collectionId)));

    if (subscriptions.length > 0) {
      await tx.insert(subscriptionTable).values(
        subscriptions.map((subscription) => ({
          userId: subscription.userId,
          name: subscription.name,
          status: subscription.status,
          iconRef: subscription.iconRef,
          category: subscription.category,
          costAmount: subscription.costAmount,
          costFrequency: subscription.costFrequency,
          nextInvoiceDate: subscription.nextInvoiceDate,
          collectionId: collection.id,
        })),
      );
    }

    return collection;
  });
}

export async function deleteMyCollection(input: { userId: string; collectionId: string }) {
  const [collection] = await db
    .delete(collectionTable)
    .where(getCollectionFilter(input.userId, input.collectionId))
    .returning();

  if (!collection) {
    throw new Error('Collection not found');
  }

  return collection;
}
