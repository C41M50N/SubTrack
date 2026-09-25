import { queryOptions } from '@tanstack/react-query';

import { listCollections } from '@/features/collections/api';

export type CollectionsListData = Awaited<ReturnType<typeof listCollections>>;
export type CollectionRecord = CollectionsListData[number];

export const collectionsListQueryKey = ['collections', 'list'] as const;

export function collectionsQueryOptions() {
  return queryOptions({
    queryKey: collectionsListQueryKey,
    queryFn: () => listCollections(),
  });
}
