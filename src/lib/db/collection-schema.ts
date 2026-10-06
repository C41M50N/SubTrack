import { sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp, unique, uniqueIndex } from 'drizzle-orm/pg-core';

import { generateId } from '@/lib/data-utils';
import { user } from '@/lib/db/auth-schema';

// Enforces that a single user cannot have two collections with the same name,
// compared case-insensitively. Names are only unique per user, not table-wide.
export const COLLECTION_NAME_UNIQUE_CONSTRAINT = 'collections_user_id_name_unique';

export const collectionTable = pgTable(
  'collections',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // All collections for this user
    index('collections_user_id_idx').on(table.userId),

    // Let subscriptions prove a referenced collection belongs to this user.
    // id is already unique; this pairs it with userId for composite foreign keys.
    unique('collections_user_id_id_unique').on(table.userId, table.id),

    // A user's collection names must be unique (scoped per user, not table-wide).
    // Uses lower(name) so uniqueness is case-insensitive ("Work" == "work").
    uniqueIndex(COLLECTION_NAME_UNIQUE_CONSTRAINT).on(table.userId, sql`lower(${table.name})`),
  ],
);
