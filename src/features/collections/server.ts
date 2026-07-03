import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { COLLECTION_NAME_UNIQUE_CONSTRAINT, collectionTable } from '@/lib/db/collection-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';

export type Collection = typeof collectionTable.$inferSelect;

// Postgres error code for a unique-constraint violation.
const PG_UNIQUE_VIOLATION = '23505';

/** True when an error is the "collection name already taken for this user" conflict. */
function isDuplicateCollectionNameError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === PG_UNIQUE_VIOLATION &&
    (error as { constraint?: unknown }).constraint === COLLECTION_NAME_UNIQUE_CONSTRAINT
  );
}

export function getCollectionFilter(userId: string, collectionId: string) {
  return and(eq(collectionTable.userId, userId), eq(collectionTable.id, collectionId));
}

/**
 * Builds a copy name that does not collide with any of the user's existing
 * collection names, e.g. "Name (copy)", "Name (copy 2)", "Name (copy 3)".
 * Collision checks are case-insensitive to match the DB uniqueness rule.
 */
function buildUniqueCopyName(baseName: string, existingNames: Set<string>): string {
  const takenLower = new Set([...existingNames].map((name) => name.toLowerCase()));
  const isTaken = (candidate: string) => takenLower.has(candidate.toLowerCase());

  const firstCandidate = `${baseName} (copy)`;

  if (!isTaken(firstCandidate)) {
    return firstCandidate;
  }

  let suffix = 2;

  while (isTaken(`${baseName} (copy ${suffix})`)) {
    suffix += 1;
  }

  return `${baseName} (copy ${suffix})`;
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
  try {
    const [collection] = await db
      .insert(collectionTable)
      .values({
        userId: input.userId,
        name: input.name,
      })
      .returning();

    return collection;
  } catch (error) {
    if (isDuplicateCollectionNameError(error)) {
      throw new Error('A collection with this name already exists');
    }

    throw error;
  }
}

export async function renameMyCollection(input: { userId: string; collectionId: string; name: string }) {
  let collection: Collection | undefined;

  try {
    [collection] = await db
      .update(collectionTable)
      .set({
        name: input.name,
      })
      .where(getCollectionFilter(input.userId, input.collectionId))
      .returning();
  } catch (error) {
    if (isDuplicateCollectionNameError(error)) {
      throw new Error('A collection with this name already exists');
    }

    throw error;
  }

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

    const existingNames = new Set(
      (
        await tx
          .select({ name: collectionTable.name })
          .from(collectionTable)
          .where(eq(collectionTable.userId, input.userId))
      ).map((row) => row.name),
    );

    const [collection] = await tx
      .insert(collectionTable)
      .values({
        userId: input.userId,
        name: buildUniqueCopyName(original.name, existingNames),
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
