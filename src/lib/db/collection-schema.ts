import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

import { generateId } from '@/lib/data-utils';
import { user } from '@/lib/db/auth-schema';

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
  ],
);
