import { api } from '@/utils/api';

export function useCollections() {
  const { data: collections, isLoading: isGetCollectionsLoading } =
    api.collections.getCollections.useQuery(undefined, {
      staleTime: Number.POSITIVE_INFINITY,
    });

  return { collections, isGetCollectionsLoading };
}
