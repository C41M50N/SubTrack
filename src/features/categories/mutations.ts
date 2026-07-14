import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createCategory } from '@/features/categories/api';
import { categoriesListQueryKey } from '@/features/categories/queries';

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { collectionId: string; name: string }) => createCategory({ data: input }),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: categoriesListQueryKey });
    },
  });
}
