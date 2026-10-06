import type { DestinationHealth } from '@/features/notifications/server';
import type { NotificationKind } from '@/lib/db/notification-schema';

type DestinationState = { paused: boolean; health: DestinationHealth };

/**
 * Whether a destination can receive notifications: not paused, and not
 * blocked by something like unavailable email. A destination that's ready
 * can still have no collection routes, so this alone doesn't mean anything
 * will be sent.
 */
export function canDeliver(destination: DestinationState): boolean {
  return !destination.paused && destination.health !== 'needs_attention';
}

/**
 * The destinations that will receive a collection's renewal reminders. A
 * working reminder setup needs a schedule and at least one of these: a
 * deliverable destination with the collection's renewal reminder route on.
 */
export function getReminderDestinations<
  Destination extends DestinationState & {
    collectionRoutes: Record<NotificationKind, boolean>;
  },
>(data: { schedule: object | null; destinations: Destination[] }): Destination[] {
  if (!data.schedule) {
    return [];
  }

  return data.destinations.filter(
    (destination) => destination.collectionRoutes.renewal_reminder && canDeliver(destination),
  );
}
