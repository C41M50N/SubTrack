import type { RowSelectionState } from '@tanstack/react-table';
import { useAtom } from 'jotai';
import React from 'react';
import { createSubscriptionColumns } from '@/components/subscriptions-table/columns';
import { useCategories } from '@/features/categories/hooks';
import { selectedCollectionIdAtom } from '@/features/collections/stores';
import { getSubscriptionsInMonth } from '@/features/subscriptions/filters';
import { useUser } from '@/features/users/hooks';
import dayjs from '@/lib/dayjs';
import { api } from '@/utils/api';

export function useDashboardSubscriptionsView() {
  const { user } = useUser();
  const [selectedCollectionId, setSelectedCollectionId] = useAtom(
    selectedCollectionIdAtom
  );
  const { data: collections } = api.collections.getCollections.useQuery(
    undefined,
    { staleTime: Number.POSITIVE_INFINITY }
  );
  const { data: subscriptions, isInitialLoading: isSubscriptionsLoading } =
    api.subscriptions.getSubscriptionsFromCollection.useQuery(
      { collectionId: selectedCollectionId || '' },
      { enabled: selectedCollectionId !== null }
    );
  const { categories, isCategoriesLoading, refetchCategories } =
    useCategories();

  const [selectedMonth, setSelectedMonth] = React.useState('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const tableColumns = React.useMemo(
    () =>
      categories && collections
        ? createSubscriptionColumns({ categories, collections })
        : [],
    [categories, collections]
  );

  const visibleSubscriptions = React.useMemo(() => {
    if (!subscriptions) {
      return [];
    }

    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return subscriptions.filter((subscription) => {
      const matchesSearch =
        normalizedSearchQuery.length === 0 ||
        subscription.name.toLowerCase().includes(normalizedSearchQuery);
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(subscription.category);
      const matchesMonth =
        selectedMonth === 'ALL' ||
        getSubscriptionsInMonth(
          [subscription],
          dayjs(selectedMonth, 'MMM YYYY').month(),
          dayjs(selectedMonth, 'MMM YYYY').year()
        ).length > 0;

      return matchesSearch && matchesCategory && matchesMonth;
    });
  }, [searchQuery, selectedCategories, selectedMonth, subscriptions]);

  React.useEffect(() => {
    if (selectedCollectionId === null && collections?.[0]) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId, setSelectedCollectionId]);

  const selectedVisibleSubscriptions = React.useMemo(
    () =>
      visibleSubscriptions.filter(
        (subscription) => rowSelection[subscription.id] === true
      ),
    [rowSelection, visibleSubscriptions]
  );

  const subscriptionsForInsights =
    selectedVisibleSubscriptions.length > 0
      ? selectedVisibleSubscriptions
      : visibleSubscriptions;

  function resetFilters() {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedMonth('ALL');
  }

  return {
    user,
    categories,
    collections,
    isCategoriesLoading,
    isSubscriptionsLoading,
    refetchCategories,
    resetFilters,
    rowSelection,
    searchQuery,
    selectedCategories,
    selectedMonth,
    setRowSelection,
    setSearchQuery,
    setSelectedCategories,
    setSelectedMonth,
    subscriptions,
    subscriptionsForInsights,
    tableColumns,
    visibleSubscriptions,
  } as const;
}
