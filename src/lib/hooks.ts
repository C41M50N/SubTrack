import type { Column } from '@tanstack/react-table';
import {
  type ActivityIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
} from 'lucide-react';
import React from 'react';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';

type TModalState = 'open' | 'closed';

export const useModalState = () => {
  const [state, setState] = React.useState<TModalState>('closed');
  return { state, setState } as const;
};

export type ModalState = ReturnType<typeof useModalState>;

import { create } from 'zustand';

interface CreateModalStateStoreParams {
  defaultState?: ModalState['state'];
}

type ModalStateStoreState = {
  state: ModalState['state'];
  set: (state: ModalState['state']) => void;
};

export function createModalStateStore({
  defaultState = 'closed',
}: CreateModalStateStoreParams) {
  return create<ModalStateStoreState>((set, get) => ({
    state: defaultState,
    set(newState) {
      set(() => ({ state: newState }));
    },
  }));
}

type LucideIcon = typeof ActivityIcon;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function useTableSortState(column: Column<any, unknown>) {
  const [sortState, setSortState] = React.useState<'asc' | 'desc' | 'none'>(
    'none'
  );
  const [sortIcon, setSortIcon] = React.useState<LucideIcon>(ArrowUpDownIcon);

  function toggleSorting() {
    if (sortState === 'none') {
      setSortState('asc');
      setSortIcon(ArrowUpIcon);
      column.toggleSorting(false);
    } else if (sortState === 'asc') {
      setSortState('desc');
      setSortIcon(ArrowDownIcon);
      column.toggleSorting(true);
    } else {
      setSortState('none');
      setSortIcon(ArrowUpDownIcon);
      column.clearSorting();
    }
  }

  return { sortState, toggleSorting, SortIcon: sortIcon };
}

export const useCategories = (enabled = true) => {
  const { data: categories, isInitialLoading: isCategoriesLoading } =
    api.categories.getCategories.useQuery(undefined, {
      staleTime: Number.POSITIVE_INFINITY,
      enabled,
    });
  return { categories, isCategoriesLoading } as const;
};

export const useSetCategories = () => {
  const ctx = api.useContext();
  const { mutateAsync: setCategories, isLoading: isSetCategoriesLoading } =
    api.categories.setCategories.useMutation({
      onSuccess: () => {
        toast({
          variant: 'success',
          title: 'Successfully set categories!',
        });
        ctx.categories.getCategories.refetch();
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
};

export const useCreateSubscription = () => {
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
};

export const useUpdateSubscription = (enabled = true) => {
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
};

export const useDeleteSubscription = () => {
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
};

export const useCollections = () => {
  const ctx = api.useContext();
  const { data: collections, isLoading: isGetCollectionsLoading } =
    api.collections.getCollections.useQuery(undefined, {
      staleTime: Number.POSITIVE_INFINITY,
    });

  return { collections, isGetCollectionsLoading };
};

export function useUser() {
  const { data: user, refetch: refreshUserData } =
    api.users.getCurrentUser.useQuery(undefined, {
      staleTime: Number.POSITIVE_INFINITY,
    });
  return { user, refreshUserData };
}
