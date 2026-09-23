import { and, asc, eq, sql } from 'drizzle-orm';

import { getMyCollection } from '@/features/collections/server';
import { db } from '@/lib/db';
import { CATEGORY_NAME_UNIQUE_CONSTRAINT, categoryTable } from '@/lib/db/category-schema';

export type Category = typeof categoryTable.$inferSelect;

// Postgres error code for a unique-constraint violation.
const PG_UNIQUE_VIOLATION = '23505';

/** True when an error is the "category name already taken in this collection" conflict. */
function isDuplicateCategoryNameError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === PG_UNIQUE_VIOLATION &&
    (error as { constraint?: unknown }).constraint === CATEGORY_NAME_UNIQUE_CONSTRAINT
  );
}

async function assertCollectionOwnership(userId: string, collectionId: string) {
  const collection = await getMyCollection(userId, collectionId);

  if (!collection) {
    throw new Error('Collection not found');
  }
}

export async function listMyCategories(userId: string, collectionId: string) {
  return db
    .select()
    .from(categoryTable)
    .where(and(eq(categoryTable.userId, userId), eq(categoryTable.collectionId, collectionId)))
    .orderBy(asc(categoryTable.name));
}

/**
 * Ensures a category with this name exists in the collection and returns it.
 * Idempotent by lower(name) so JIT "Add X" is safe when the name (or a
 * case-variant of it) already exists.
 */
export async function createMyCategory(input: { userId: string; collectionId: string; name: string }) {
  await assertCollectionOwnership(input.userId, input.collectionId);

  const nameKey = input.name.toLowerCase();

  const findExisting = () =>
    db
      .select()
      .from(categoryTable)
      .where(
        and(
          eq(categoryTable.userId, input.userId),
          eq(categoryTable.collectionId, input.collectionId),
          sql`lower(${categoryTable.name}) = ${nameKey}`,
        ),
      )
      .limit(1);

  const [existing] = await findExisting();

  if (existing) {
    return existing;
  }

  try {
    const [category] = await db
      .insert(categoryTable)
      .values({
        userId: input.userId,
        collectionId: input.collectionId,
        name: input.name,
      })
      .returning();

    return category;
  } catch (error) {
    // A concurrent insert may have won the race; return the existing row.
    if (isDuplicateCategoryNameError(error)) {
      const [existingAfterRace] = await findExisting();

      if (existingAfterRace) {
        return existingAfterRace;
      }
    }

    throw error;
  }
}

/** Throws unless the category exists and belongs to this user's collection. */
export async function assertCategoryInCollection(userId: string, collectionId: string, categoryId: string) {
  const [category] = await db
    .select({ id: categoryTable.id })
    .from(categoryTable)
    .where(
      and(
        eq(categoryTable.id, categoryId),
        eq(categoryTable.userId, userId),
        eq(categoryTable.collectionId, collectionId),
      ),
    )
    .limit(1);

  if (!category) {
    throw new Error('Category not found');
  }
}
