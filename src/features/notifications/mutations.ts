import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';

import {
  createEmailDestination,
  createWebhookDestination,
  deleteDestination,
  rotateSigningSecret,
  saveNotificationSchedule,
  sendTestNotification,
  setDestinationPaused,
  setRoute,
  setSubscriptionsInclusion,
  updateDestination,
} from '@/features/notifications/api';
import { notificationsQueryKey } from '@/features/notifications/queries';
import type {
  createWebhookDestinationInputSchema,
  saveNotificationScheduleInputSchema,
  sendTestNotificationInputSchema,
  setRouteInputSchema,
  updateDestinationInputSchema,
} from '@/features/notifications/schema';
import { subscriptionsListQueryKey } from '@/features/subscriptions/queries';

// Settings, destinations, routes, and inclusion all feed the same few views,
// so every change refreshes everything under the notifications key.
function useNotificationsMutation<Variables, Result>(
  mutationFn: (variables: Variables) => Promise<Result>,
  options: { invalidateSubscriptions?: boolean } = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationsQueryKey }),
        options.invalidateSubscriptions
          ? queryClient.invalidateQueries({ queryKey: subscriptionsListQueryKey })
          : undefined,
      ]),
  });
}

export function useSaveNotificationSchedule() {
  return useNotificationsMutation((input: z.infer<typeof saveNotificationScheduleInputSchema>) =>
    saveNotificationSchedule({ data: input }),
  );
}

export function useCreateWebhookDestination() {
  return useNotificationsMutation((input: z.infer<typeof createWebhookDestinationInputSchema>) =>
    createWebhookDestination({ data: input }),
  );
}

export function useCreateEmailDestination() {
  return useNotificationsMutation((name: string) => createEmailDestination({ data: { name } }));
}

export function useUpdateDestination() {
  return useNotificationsMutation((input: z.infer<typeof updateDestinationInputSchema>) =>
    updateDestination({ data: input }),
  );
}

export function useSetDestinationPaused() {
  return useNotificationsMutation((input: { destinationId: string; paused: boolean }) =>
    setDestinationPaused({ data: input }),
  );
}

export function useRotateSigningSecret() {
  return useNotificationsMutation((destinationId: string) => rotateSigningSecret({ data: { destinationId } }));
}

export function useDeleteDestination() {
  return useNotificationsMutation((destinationId: string) => deleteDestination({ data: { destinationId } }));
}

export function useSendTestNotification() {
  return useMutation({
    mutationFn: (input: z.infer<typeof sendTestNotificationInputSchema>) => sendTestNotification({ data: input }),
  });
}

export function useSetRoute() {
  return useNotificationsMutation((input: z.infer<typeof setRouteInputSchema>) => setRoute({ data: input }), {
    invalidateSubscriptions: true,
  });
}

export function useSetSubscriptionsInclusion() {
  return useNotificationsMutation(
    (input: { subscriptionIds: string[]; included: boolean }) => setSubscriptionsInclusion({ data: input }),
    { invalidateSubscriptions: true },
  );
}
