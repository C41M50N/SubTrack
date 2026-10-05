import { eq } from 'drizzle-orm';

import { FALLBACK_TIME_ZONE, toLocalDateKey } from '@/features/notifications/time';
import { db, type DbTransaction } from '@/lib/db';
import { notificationSettingsTable } from '@/lib/db/notification-schema';

/** The user's chosen time zone, or UTC until they choose one. */
export async function getUserTimeZone(userId: string, executor: typeof db | DbTransaction = db): Promise<string> {
  const [settings] = await executor
    .select({ timeZone: notificationSettingsTable.timeZone })
    .from(notificationSettingsTable)
    .where(eq(notificationSettingsTable.userId, userId))
    .limit(1);

  return settings?.timeZone ?? FALLBACK_TIME_ZONE;
}

/** Today's calendar date for the user, which invoice processing and notifications share. */
export async function getUserLocalDate(
  userId: string,
  now: Date = new Date(),
  executor: typeof db | DbTransaction = db,
): Promise<string> {
  return toLocalDateKey(now, await getUserTimeZone(userId, executor));
}
