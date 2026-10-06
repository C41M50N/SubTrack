import { and, asc, eq, isNull } from 'drizzle-orm';

import { INITIAL_COLLECTION_NAME } from '@/features/collections/schema';
import { getMyCollection, insertCollection } from '@/features/collections/server';
import { getReminderDestinations } from '@/features/notifications/reminder-setup';
import { getMyCollectionNotifications } from '@/features/notifications/server';
import { saveInitialTimeZone } from '@/features/notifications/user-time-zone';
import { db, type DbTransaction } from '@/lib/db';
import { collectionTable } from '@/lib/db/collection-schema';
import { onboardingTable } from '@/lib/db/onboarding-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';

type Executor = typeof db | DbTransaction;

export type ReminderInvitation = {
  /** The collection whose first save triggered the invitation, or null if it was deleted since. */
  collection: { id: string; name: string } | null;
};

export type OnboardingStatus = {
  /** Whether the account has saved its first subscription. */
  completed: boolean;
  /** The one-time reminder invitation, while it's waiting to be shown. */
  reminderInvitation: ReminderInvitation | null;
};

/**
 * The account's onboarding row, created on first use. Accounts that already
 * have subscriptions predate onboarding, so they start out complete and are
 * never offered the reminder invitation.
 */
async function getOrCreateOnboarding(executor: Executor, userId: string) {
  const findOnboarding = () =>
    executor.select().from(onboardingTable).where(eq(onboardingTable.userId, userId)).limit(1);

  const [existing] = await findOnboarding();

  if (existing) {
    return existing;
  }

  const [subscription] = await executor
    .select({ id: subscriptionTable.id })
    .from(subscriptionTable)
    .where(eq(subscriptionTable.userId, userId))
    .limit(1);

  await executor
    .insert(onboardingTable)
    .values(
      subscription ? { userId, firstSubscriptionSavedAt: new Date(), reminderInvitation: 'suppressed' } : { userId },
    )
    // A concurrent request may have created it first.
    .onConflictDoNothing();

  const [created] = await findOnboarding();

  return created;
}

/**
 * Gets an account ready to track subscriptions. An account without
 * collections receives a Personal collection with the starter categories, and
 * the browser's time zone becomes its default unless one is already saved.
 * Safe to repeat or run concurrently. Returns the collection to open.
 */
export async function setUpMyAccount(input: { userId: string; timeZone?: string }) {
  return db.transaction(async (tx) => {
    await getOrCreateOnboarding(tx, input.userId);

    // Serializes setup per account, so overlapping visits can't each see no
    // collections and create two.
    await tx
      .select({ userId: onboardingTable.userId })
      .from(onboardingTable)
      .where(eq(onboardingTable.userId, input.userId))
      .for('update');

    // Matches the order collections are listed in, so this is the one
    // /dashboard opens.
    const [first] = await tx
      .select({ id: collectionTable.id })
      .from(collectionTable)
      .where(eq(collectionTable.userId, input.userId))
      .orderBy(asc(collectionTable.name))
      .limit(1);

    if (first) {
      return { collectionId: first.id };
    }

    const collection = await insertCollection(tx, { userId: input.userId, name: INITIAL_COLLECTION_NAME });
    await saveInitialTimeZone(input.userId, input.timeZone, tx);

    return { collectionId: collection.id };
  });
}

export async function getMyOnboarding(userId: string): Promise<OnboardingStatus> {
  const onboarding = await getOrCreateOnboarding(db, userId);
  const completed = onboarding.firstSubscriptionSavedAt !== null;

  if (onboarding.reminderInvitation !== 'pending') {
    return { completed, reminderInvitation: null };
  }

  const collection = onboarding.collectionId ? await getMyCollection(userId, onboarding.collectionId) : null;

  // Someone who already set up reminders for the collection doesn't need the
  // invitation, now or later.
  if (collection && getReminderDestinations(await getMyCollectionNotifications(userId, collection.id)).length > 0) {
    await db
      .update(onboardingTable)
      .set({ reminderInvitation: 'suppressed' })
      .where(and(eq(onboardingTable.userId, userId), eq(onboardingTable.reminderInvitation, 'pending')));

    return { completed, reminderInvitation: null };
  }

  return {
    completed,
    reminderInvitation: { collection: collection ? { id: collection.id, name: collection.name } : null },
  };
}

/** The invitation shows once: displaying it uses it up, whatever the user chooses. */
export async function markMyReminderInvitationShown(userId: string) {
  await db
    .update(onboardingTable)
    .set({ reminderInvitation: 'shown' })
    .where(and(eq(onboardingTable.userId, userId), eq(onboardingTable.reminderInvitation, 'pending')));
}

/**
 * Completes onboarding on the account's first saved subscription and queues
 * the reminder invitation. Call it in the transaction that saves the
 * subscriptions, before inserting them, so a failed save changes nothing and
 * the new rows aren't mistaken for earlier ones.
 */
export async function recordSubscriptionSave(tx: DbTransaction, input: { userId: string; collectionId: string }) {
  const onboarding = await getOrCreateOnboarding(tx, input.userId);

  if (onboarding.firstSubscriptionSavedAt) {
    return;
  }

  // The null check makes a concurrent first save a no-op once this commits.
  await tx
    .update(onboardingTable)
    .set({ firstSubscriptionSavedAt: new Date(), collectionId: input.collectionId, reminderInvitation: 'pending' })
    .where(and(eq(onboardingTable.userId, input.userId), isNull(onboardingTable.firstSubscriptionSavedAt)));
}
