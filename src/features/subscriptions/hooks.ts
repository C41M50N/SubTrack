import { toast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';

export function useSubscriptionsFromCollection(
  collectionId: string | null,
  enabled = true
) {
  const { data: subscriptions, isInitialLoading: isSubscriptionsLoading } =
    api.subscriptions.getSubscriptionsFromCollection.useQuery(
      { collectionId: collectionId ?? '' },
      { enabled: enabled && collectionId !== null }
    );

  return { subscriptions, isSubscriptionsLoading } as const;
}

export function useCreateSubscription() {
  const utils = api.useUtils();
  const {
    mutateAsync: createSubscription,
    isLoading: isCreateSubscriptionLoading,
  } = api.subscriptions.createSubscription.useMutation({
    async onSuccess(_, newSubscription) {
      toast({
        variant: 'success',
        title: `Successfully created ${newSubscription.name} subscription!`,
      });
      await utils.subscriptions.getSubscriptionsFromCollection.invalidate();
    },
    onError: (err) => {
      toast({
        variant: 'error',
        title: 'Something went wrong...',
        description: err.message,
      });
    },
  });

  return { createSubscription, isCreateSubscriptionLoading };
}

export function useUpdateSubscription() {
  const utils = api.useUtils();
  const {
    mutateAsync: updateSubscription,
    isLoading: isUpdateSubscriptionLoading,
  } = api.subscriptions.updateSubscription.useMutation({
    async onSuccess() {
      toast({
        variant: 'success',
        title: 'Successfully updated subscription!',
      });
      await utils.subscriptions.getSubscriptionsFromCollection.invalidate();
    },
    onError: (err) => {
      toast({
        variant: 'error',
        title: 'Something went wrong...',
        description: err.message,
      });
    },
  });

  return { updateSubscription, isUpdateSubscriptionLoading };
}

export function useDeleteSubscription() {
  const utils = api.useUtils();
  const {
    mutateAsync: deleteSubscription,
    isLoading: isDeleteSubscriptionLoading,
  } = api.subscriptions.deleteSubscription.useMutation({
    async onSuccess() {
      toast({
        variant: 'success',
        title: 'Successfully deleted subscription!',
      });
      await utils.subscriptions.getSubscriptionsFromCollection.invalidate();
    },
    onError: (err) => {
      toast({
        variant: 'error',
        title: 'Something went wrong...',
        description: err.message,
      });
    },
  });

  return { deleteSubscription, isDeleteSubscriptionLoading };
}

export function useMoveSubscription() {
  const utils = api.useUtils();
  const {
    mutateAsync: moveSubscription,
    isLoading: isMoveSubscriptionLoading,
  } = api.subscriptions.moveSubscription.useMutation({
    async onSuccess() {
      toast({
        variant: 'success',
        title: 'Successfully moved subscription!',
      });
      await utils.subscriptions.getSubscriptionsFromCollection.invalidate();
    },
    onError: (err) => {
      toast({
        variant: 'error',
        title: 'Something went wrong...',
        description: err.message,
      });
    },
  });

  return { moveSubscription, isMoveSubscriptionLoading };
}
