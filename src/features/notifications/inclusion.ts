import { and, eq, inArray, ne } from 'drizzle-orm';

import type { DbTransaction } from '@/lib/db';
import { subscriptionInvoiceTable } from '@/lib/db/invoice-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';

/**
 * Turns inclusion on or off for subscriptions, and applies the same choice to
 * their recorded invoices so it survives deletion. Turning inclusion back on
 * only affects reminders whose send time hasn't passed.
 */
export async function applyInclusion(
  tx: DbTransaction,
  input: { userId: string; subscriptionIds: string[]; included: boolean; collectionId?: string },
) {
  if (input.subscriptionIds.length === 0) {
    return [];
  }

  const owned = and(
    eq(subscriptionTable.userId, input.userId),
    inArray(subscriptionTable.id, input.subscriptionIds),
    input.collectionId ? eq(subscriptionTable.collectionId, input.collectionId) : undefined,
  );

  const changed = await tx
    .update(subscriptionTable)
    .set({
      notificationsIncluded: input.included,
      ...(input.included ? { remindersEligibleAt: new Date() } : {}),
    })
    .where(and(owned, ne(subscriptionTable.notificationsIncluded, input.included)))
    .returning({ id: subscriptionTable.id });

  if (changed.length > 0) {
    await tx
      .update(subscriptionInvoiceTable)
      .set({ notificationsIncluded: input.included })
      .where(
        and(
          eq(subscriptionInvoiceTable.userId, input.userId),
          inArray(
            subscriptionInvoiceTable.subscriptionId,
            changed.map((row) => row.id),
          ),
        ),
      );
  }

  return changed;
}
