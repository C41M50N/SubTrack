import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';

import { categoriesListQueryKey } from '@/features/categories/queries';
import { collectionsListQueryKey } from '@/features/collections/queries';
import {
  clearSubscriptions,
  createSubscription,
  deleteSubscription,
  seedSubscriptions,
  updateSubscription,
} from '@/features/subscriptions/api';
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

// Dev-only: seeding can create categories, so invalidate categories too. Collections
// are invalidated to refresh any aggregate counts derived from them.
function invalidateSeededData(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: subscriptionsListQueryKey }),
    queryClient.invalidateQueries({ queryKey: categoriesListQueryKey }),
    queryClient.invalidateQueries({ queryKey: collectionsListQueryKey }),
  ]);
}

export function useSeedSubscriptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionId: string) => seedSubscriptions({ data: { collectionId } }),
    onSuccess: () => invalidateSeededData(queryClient),
  });
}

export function useClearSubscriptions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionId: string) => clearSubscriptions({ data: { collectionId } }),
    onSuccess: () => invalidateSeededData(queryClient),
  });
}
