import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createCollection } from '@/features/collections/api';
import { collectionsListQueryKey } from '@/features/collections/queries';

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createCollection({ data: { name } }),
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: collectionsListQueryKey,
      });
    },
  });
}
