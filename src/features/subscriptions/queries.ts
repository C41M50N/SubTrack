import { queryOptions } from '@tanstack/react-query';
import type { z } from 'zod';

import { listSubscriptions } from '@/features/subscriptions/api';
import type { listSubscriptionsInputSchema } from '@/features/subscriptions/schema';

export type SubscriptionsListData = Awaited<ReturnType<typeof listSubscriptions>>;
export type SubscriptionRecord = SubscriptionsListData[number];
export type SubscriptionListFilters = z.infer<typeof listSubscriptionsInputSchema>;

export const subscriptionsListQueryKey = ['subscriptions', 'list'] as const;

export function subscriptionsQueryOptions(filters?: SubscriptionListFilters) {
  return queryOptions({
    queryKey: [...subscriptionsListQueryKey, filters ?? null] as const,
    queryFn: () => listSubscriptions({ data: filters }),
  });
}
