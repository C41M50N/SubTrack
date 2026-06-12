import { toast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';

export function useCreateSubscription() {
  const ctx = api.useContext();
  const {
    mutateAsync: createSubscription,
    isLoading: isCreateSubscriptionLoading,
  } = api.subscriptions.createSubscription.useMutation({
    onSuccess: (_, newSubscription) => {
      toast({
        variant: 'success',
        title: `Successfully created ${newSubscription.name} subscription!`,
      });
      ctx.subscriptions.getSubscriptionsFromCollection.invalidate();
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
  const ctx = api.useContext();
  const {
    mutateAsync: updateSubscription,
    isLoading: isUpdateSubscriptionLoading,
  } = api.subscriptions.updateSubscription.useMutation({
    onSuccess: () => {
      toast({
        variant: 'success',
        title: 'Successfully updated subscription!',
      });
      ctx.subscriptions.getSubscriptionsFromCollection.refetch();
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
  const ctx = api.useContext();
  const {
    mutateAsync: deleteSubscription,
    isLoading: isDeleteSubscriptionLoading,
  } = api.subscriptions.deleteSubscription.useMutation({
    onSuccess: () => {
      toast({
        variant: 'success',
        title: 'Successfully deleted subscription!',
      });
      ctx.subscriptions.getSubscriptionsFromCollection.refetch();
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
  const ctx = api.useContext();
  const {
    mutateAsync: moveSubscription,
    isLoading: isMoveSubscriptionLoading,
  } = api.subscriptions.moveSubscription.useMutation({
    onSuccess: () => {
      toast({
        variant: 'success',
        title: 'Successfully moved subscription!',
      });
      ctx.subscriptions.getSubscriptionsFromCollection.invalidate();
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
