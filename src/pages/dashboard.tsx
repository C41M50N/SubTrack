import type { RowSelectionState } from '@tanstack/react-table';
import { useAtom } from 'jotai';
import React from 'react';

import { Separator } from '@/components/ui/separator';
import { useCategories } from '@/features/categories/hooks';
import { useCollections } from '@/features/collections/hooks';
import { selectedCollectionIdAtom } from '@/features/collections/stores';
import { DashboardModalHost } from '@/features/dashboard/components/dashboard-modal-host';
import { SubscriptionInsightsPanel } from '@/features/dashboard/components/subscription-insights-panel';
import { SubscriptionsTableSection } from '@/features/dashboard/components/subscriptions-table-section';
import {
  ALL_MONTHS_FILTER,
  filterDashboardSubscriptions,
} from '@/features/dashboard/filter-dashboard-subscriptions';
import { useSubscriptionsFromCollection } from '@/features/subscriptions/hooks';
import { useUser } from '@/features/users/hooks';
import MainLayout from '@/layouts/main';

export default function DashboardPage() {
  const { user } = useUser();
  const [selectedCollectionId, setSelectedCollectionId] = useAtom(
    selectedCollectionIdAtom,
  );
  const { collections } = useCollections();
  const { subscriptions, isSubscriptionsLoading } =
    useSubscriptionsFromCollection(selectedCollectionId);
  const { categories, isCategoriesLoading } = useCategories();

  const [selectedMonth, setSelectedMonth] = React.useState(ALL_MONTHS_FILTER);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    [],
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const visibleSubscriptions = React.useMemo(
    () =>
      filterDashboardSubscriptions(subscriptions ?? [], {
        searchQuery,
        selectedCategories,
        selectedMonth,
      }),
    [searchQuery, selectedCategories, selectedMonth, subscriptions],
  );

  React.useEffect(() => {
    if (selectedCollectionId === null && collections?.[0]) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections, selectedCollectionId, setSelectedCollectionId]);

  const selectedVisibleSubscriptions = React.useMemo(
    () =>
      visibleSubscriptions.filter(
        (subscription) => rowSelection[subscription.id] === true,
      ),
    [rowSelection, visibleSubscriptions],
  );

  const subscriptionsForInsights =
    selectedVisibleSubscriptions.length > 0
      ? selectedVisibleSubscriptions
      : visibleSubscriptions;

  function resetFilters() {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedMonth(ALL_MONTHS_FILTER);
  }

  return (
    <MainLayout title="Dashboard | SubTrack">
      <h1 className="pt-4 pb-1 text-2xl">Dashboard</h1>
      <p className="text-muted-foreground">Track your subscriptions here.</p>
      <Separator className="mt-4 mb-6" />

      <div className="flex flex-row gap-6">
        <div className="w-full">
          <SubscriptionsTableSection
            categories={categories || []}
            collections={collections || []}
            data={visibleSubscriptions}
            isCategoriesLoading={isCategoriesLoading}
            isSubscriptionsLoading={isSubscriptionsLoading}
            onResetFilters={resetFilters}
            onRowSelectionChange={setRowSelection}
            onSearchQueryChange={setSearchQuery}
            onSelectedCategoriesChange={setSelectedCategories}
            onSelectedMonthChange={setSelectedMonth}
            rowSelection={rowSelection}
            searchQuery={searchQuery}
            selectedCategories={selectedCategories}
            selectedMonth={selectedMonth}
            showTable={Boolean(
              user && subscriptions && !isSubscriptionsLoading,
            )}
          />
        </div>

        <SubscriptionInsightsPanel
          isSubscriptionsLoading={isSubscriptionsLoading}
          subscriptions={subscriptions}
          subscriptionsForInsights={subscriptionsForInsights}
        />
      </div>

      {categories && collections && (
        <DashboardModalHost categories={categories} collections={collections} />
      )}
    </MainLayout>
  );
}
