import { sql } from 'drizzle-orm';
import { check, date, foreignKey, index, integer, pgEnum, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

import { generateId } from '@/lib/data-utils';
import { user } from '@/lib/db/auth-schema';
import { categoryTable } from '@/lib/db/category-schema';
import { collectionTable } from '@/lib/db/collection-schema';

export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive']);

export const subscriptionCostFrequencyEnum = pgEnum('subscription_cost_frequency', [
  'weekly',
  'monthly',
  'yearly',
  'biennially',
]);

export const subscriptionTable = pgTable(
  'subscriptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    status: subscriptionStatusEnum('status').notNull().default('active'),
    iconRef: text('icon_ref').notNull(),
    // Categories are collection-scoped. Deleting a category leaves its
    // subscriptions "Uncategorized" rather than removing them.
    categoryId: text('category_id').references(() => categoryTable.id, { onDelete: 'set null' }),
    costAmount: integer('cost_amount').notNull(), // in cents
    costFrequency: subscriptionCostFrequencyEnum('cost_frequency').notNull(),
    nextInvoiceDate: date('next_invoice_date', { mode: 'string' }).notNull(),
    collectionId: text('collection_id')
      .notNull()
      .references(() => collectionTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // All subscriptions for this user
    index('subscriptions_user_id_idx').on(table.userId),

    // All subscriptions for this user in this collection
    index('subscriptions_user_collection_id_idx').on(table.userId, table.collectionId),

    // All subscriptions for this user with this status
    index('subscriptions_user_status_idx').on(table.userId, table.status),

    // All subscriptions assigned to this category
    index('subscriptions_category_id_idx').on(table.categoryId),

    // Let other tables prove a referenced subscription belongs to this user.
    // id is already unique; this pairs it with userId for composite foreign keys.
    unique('subscriptions_user_id_id_unique').on(table.userId, table.id),

    // Prevent assigning a subscription to another user's collection.
    // The (userId, collectionId) pair must match a collection owned by that same user.
    foreignKey({
      name: 'subscriptions_user_collection_fk',
      columns: [table.userId, table.collectionId],
      foreignColumns: [collectionTable.userId, collectionTable.id],
    }).onDelete('cascade'),

    // Require that the costAmount is non-negative
    check('subscriptions_cost_amount_non_negative', sql`${table.costAmount} >= 0`),
  ],
);
