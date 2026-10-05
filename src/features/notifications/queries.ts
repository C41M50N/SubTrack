import { queryOptions } from '@tanstack/react-query';

import {
  getCollectionNotifications,
  getNotificationSettings,
  listNotificationDestinations,
} from '@/features/notifications/api';

export type NotificationSettingsData = Awaited<ReturnType<typeof getNotificationSettings>>;
export type DestinationRecord = NotificationSettingsData['destinations'][number];
export type CollectionNotificationsData = Awaited<ReturnType<typeof getCollectionNotifications>>;
export type CollectionDestinationRecord = CollectionNotificationsData['destinations'][number];

export const notificationsQueryKey = ['notifications'] as const;
export const notificationSettingsQueryKey = [...notificationsQueryKey, 'settings'] as const;
export const notificationDestinationsQueryKey = [...notificationsQueryKey, 'destinations'] as const;

export function notificationSettingsQueryOptions() {
  return queryOptions({
    queryKey: notificationSettingsQueryKey,
    queryFn: () => getNotificationSettings(),
  });
}

/** Destinations alone, for the account-level alert shown on every page. */
export function notificationDestinationsQueryOptions() {
  return queryOptions({
    queryKey: notificationDestinationsQueryKey,
    queryFn: () => listNotificationDestinations(),
    staleTime: 60_000,
  });
}

export function collectionNotificationsQueryOptions(collectionId: string) {
  return queryOptions({
    queryKey: [...notificationsQueryKey, 'collection', collectionId] as const,
    queryFn: () => getCollectionNotifications({ data: { collectionId } }),
  });
}
