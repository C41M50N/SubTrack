import { toast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';

const CATEGORY_STALE_TIME_MS = 1_800_000;

export function useCategories(enabled = true) {
  const { data: categories, isInitialLoading: isCategoriesLoading } =
    api.categories.getCategories.useQuery(undefined, {
      staleTime: CATEGORY_STALE_TIME_MS,
      enabled,
    });

  return { categories, isCategoriesLoading } as const;
}

export function useSetCategories() {
  const utils = api.useUtils();
  const { mutateAsync: setCategories, isLoading: isSetCategoriesLoading } =
    api.categories.setCategories.useMutation({
      async onSuccess() {
        toast({
          variant: 'success',
          title: 'Successfully set categories!',
        });
        await utils.categories.getCategories.invalidate();
      },
      onError: (err) => {
        toast({
          variant: 'error',
          title: 'Something went wrong...',
          description: err.message,
        });
      },
    });

  return { setCategories, isSetCategoriesLoading };
}
