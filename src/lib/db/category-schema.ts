import { sql } from 'drizzle-orm';
import { foreignKey, index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { generateId } from '@/lib/data-utils';
import { user } from '@/lib/db/auth-schema';
import { collectionTable } from '@/lib/db/collection-schema';

// Enforces that a single collection cannot have two categories with the same
// name, compared case-insensitively. Names are only unique per collection.
export const CATEGORY_NAME_UNIQUE_CONSTRAINT = 'categories_collection_name_unique';

export const categoryTable = pgTable(
  'categories',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    collectionId: text('collection_id').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // All categories for this user in this collection
    index('categories_user_collection_idx').on(table.userId, table.collectionId),

    // A collection's category names must be unique (scoped per collection).
    // Uses lower(name) so uniqueness is case-insensitive ("Streaming" == "streaming").
    uniqueIndex(CATEGORY_NAME_UNIQUE_CONSTRAINT).on(table.collectionId, sql`lower(${table.name})`),

    // Prevent assigning a category to another user's collection.
    // The (userId, collectionId) pair must match a collection owned by that same user.
    foreignKey({
      name: 'categories_user_collection_fk',
      columns: [table.userId, table.collectionId],
      foreignColumns: [collectionTable.userId, collectionTable.id],
    }).onDelete('cascade'),
  ],
);
