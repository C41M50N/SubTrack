import { toast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';

export function useImportData() {
  const utils = api.useUtils();
  const { mutateAsync: importData, isLoading: isImportDataLoading } =
    api.data.importData.useMutation({
      async onSuccess() {
        toast({
          variant: 'success',
          title: 'Successfully imported data',
        });
        await Promise.all([
          utils.subscriptions.getSubscriptionsFromCollection.invalidate(),
          utils.categories.getCategories.invalidate(),
          utils.collections.getCollections.invalidate(),
        ]);
      },
      onError(error) {
        toast({
          variant: 'error',
          title: 'Failed to import data',
          description: error.message,
        });
      },
    });

  return { importData, isImportDataLoading } as const;
}
