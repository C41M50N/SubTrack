import { eq } from 'drizzle-orm';

import { FALLBACK_TIME_ZONE, normalizeTimeZone, toLocalDateKey } from '@/features/notifications/time';
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

/**
 * Saves a detected time zone as the user's default unless they already have
 * one, so a later visit or another browser never overwrites their choice. An
 * invalid zone is ignored, which keeps the UTC fallback until they choose one.
 */
export async function saveInitialTimeZone(
  userId: string,
  timeZone: string | undefined,
  executor: typeof db | DbTransaction = db,
): Promise<void> {
  const normalized = timeZone ? normalizeTimeZone(timeZone) : null;

  if (!normalized) {
    return;
  }

  await executor.insert(notificationSettingsTable).values({ userId, timeZone: normalized }).onConflictDoNothing();
}
