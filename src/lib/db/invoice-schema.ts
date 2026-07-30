import { sql } from 'drizzle-orm';
import { check, date, foreignKey, index, integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

import { generateId } from '@/lib/data-utils';
import { user } from '@/lib/db/auth-schema';
import { collectionTable } from '@/lib/db/collection-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';

export const subscriptionInvoiceTable = pgTable(
  'subscription_invoices',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // Keep invoice history after a subscription is deleted.
    // When the subscription goes away, this live link becomes null.
    subscriptionId: text('subscription_id').references(() => subscriptionTable.id, { onDelete: 'set null' }),
    // Snapshot the owning collection so invoices stay collection-scoped even
    // after their subscription is deleted (which nulls subscriptionId).
    // Deleting the collection itself cascade-deletes its invoice history.
    collectionId: text('collection_id')
      .notNull()
      .references(() => collectionTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    iconRef: text('icon_ref').notNull(),
    category: text('category').notNull(),
    amount: integer('amount').notNull(), // in cents
    invoiceDate: date('invoice_date', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    // All invoices for this user
    index('subscription_invoices_user_id_idx').on(table.userId),

    // Month-bounded invoice history for this user and collection.
    index('subscription_invoices_user_collection_date_idx').on(table.userId, table.collectionId, table.invoiceDate),

    // All invoices linked to this subscription
    index('subscription_invoices_subscription_id_idx').on(table.subscriptionId),

    // All invoices on or near this calendar date
    index('subscription_invoices_invoice_date_idx').on(table.invoiceDate),

    // A scheduled charge may be recorded only once for a subscription.
    unique('subscription_invoices_subscription_id_invoice_date_unique').on(table.subscriptionId, table.invoiceDate),

    // Prevent attributing an invoice to another user's collection.
    // The (userId, collectionId) pair must match a collection owned by that same user.
    foreignKey({
      name: 'subscription_invoices_user_collection_fk',
      columns: [table.userId, table.collectionId],
      foreignColumns: [collectionTable.userId, collectionTable.id],
    }).onDelete('cascade'),

    // Require that the invoice amount is non-negative
    check('subscription_invoices_amount_non_negative', sql`${table.amount} >= 0`),
  ],
);
