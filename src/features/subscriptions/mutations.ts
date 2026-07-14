import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';

import { createSubscription, deleteSubscription, updateSubscription } from '@/features/subscriptions/api';
import { subscriptionsListQueryKey } from '@/features/subscriptions/queries';
import type { createSubscriptionInputSchema, updateSubscriptionInputSchema } from '@/features/subscriptions/schema';

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionInputSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionInputSchema>;

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSubscriptionInput) => createSubscription({ data: input }),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: subscriptionsListQueryKey });
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSubscriptionInput) => updateSubscription({ data: input }),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: subscriptionsListQueryKey });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: string) => deleteSubscription({ data: { subscriptionId } }),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: subscriptionsListQueryKey });
    },
  });
}

export function useDeleteSubscriptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionIds: string[]) =>
      Promise.all(subscriptionIds.map((subscriptionId) => deleteSubscription({ data: { subscriptionId } }))),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: subscriptionsListQueryKey });
    },
  });
}
