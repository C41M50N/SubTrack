import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { user } from '@/lib/db/auth-schema';
import { collectionTable } from '@/lib/db/collection-schema';

// The one-time "Set up reminders" invitation. `pending` waits for the next
// dashboard visit, `shown` has been displayed, and `suppressed` means it is
// never offered, such as to accounts that already had subscriptions.
export const reminderInvitationStatusEnum = pgEnum('reminder_invitation_status', ['pending', 'shown', 'suppressed']);

export type ReminderInvitationStatus = (typeof reminderInvitationStatusEnum.enumValues)[number];

// One row per account. Progress is account-wide, so it survives refreshes,
// later sign-ins, and other devices, and never restarts per collection.
export const onboardingTable = pgTable('onboarding', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  // When the account first saved a subscription by adding or importing one.
  // Dashboard visits open in onboarding until then. Removing subscriptions
  // later doesn't clear it.
  firstSubscriptionSavedAt: timestamp('first_subscription_saved_at', { withTimezone: true }),
  // The collection that first save went into. Reminder setup hands off to it.
  collectionId: text('collection_id').references(() => collectionTable.id, { onDelete: 'set null' }),
  // Null until the first save decides whether the invitation is offered.
  reminderInvitation: reminderInvitationStatusEnum('reminder_invitation'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
