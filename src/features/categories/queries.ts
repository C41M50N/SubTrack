import { queryOptions } from '@tanstack/react-query';

import { listCategories } from '@/features/categories/api';

export type CategoriesListData = Awaited<ReturnType<typeof listCategories>>;
export type CategoryRecord = CategoriesListData[number];

export const categoriesListQueryKey = ['categories', 'list'] as const;

export function categoriesQueryOptions(collectionId: string) {
  return queryOptions({
    queryKey: [...categoriesListQueryKey, collectionId] as const,
    queryFn: () => listCategories({ data: { collectionId } }),
  });
}
