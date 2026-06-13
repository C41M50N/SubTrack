import { toast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';

const COLLECTION_STALE_TIME_MS = Number.POSITIVE_INFINITY;

export function useCollections() {
  const { data: collections, isLoading: isGetCollectionsLoading } =
    api.collections.getCollections.useQuery(undefined, {
      staleTime: COLLECTION_STALE_TIME_MS,
    });

  return { collections, isGetCollectionsLoading } as const;
}

export function useCreateCollection() {
  const utils = api.useUtils();
  const {
    mutateAsync: createCollection,
    isLoading: isCreateCollectionLoading,
  } = api.collections.createCollection.useMutation({
    async onSuccess() {
      await utils.collections.getCollections.invalidate();
    },
    onError(error) {
      toast({
        variant: 'error',
        title: error.message,
      });
    },
  });

  return { createCollection, isCreateCollectionLoading } as const;
}

export function useEditCollectionTitle() {
  const utils = api.useUtils();
  const {
    mutateAsync: editCollectionTitle,
    isLoading: isEditCollectionLoading,
  } = api.collections.editCollectionTitle.useMutation({
    async onSuccess() {
      await utils.collections.getCollections.invalidate();
    },
    onError(error) {
      toast({
        variant: 'error',
        title: error.message,
      });
    },
  });

  return { editCollectionTitle, isEditCollectionLoading } as const;
}

export function useDeleteCollection() {
  const utils = api.useUtils();
  const { mutateAsync: deleteCollection } =
    api.collections.deleteCollection.useMutation({
      async onSuccess() {
        await utils.collections.getCollections.invalidate();
        await utils.subscriptions.getSubscriptionsFromCollection.invalidate();
      },
      onError(error) {
        toast({
          variant: 'error',
          title: error.message,
        });
      },
    });

  return { deleteCollection } as const;
}
