import { useAtom } from 'jotai';
import type { RowSelectionState } from '@tanstack/react-table';
import React from 'react';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import SkeletonStatisticCard from '@/components/subscriptions/skeleton-statistic-card';
import StatisticCard from '@/components/subscriptions/statistic-card';
import { createSubscriptionColumns } from '@/components/subscriptions-table/columns';
import DataTable from '@/components/subscriptions-table/data-table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { selectedCollectionIdAtom } from '@/features/common/atoms';
import { Statistics } from '@/features/common/subscription-stats';
import {
  getNextNMonths,
  getSubscriptionsInMonth,
} from '@/features/subscriptions/utils';
import dayjs from '@/lib/dayjs';
import MainLayout from '@/layouts/main';
import { useCategories, useUser } from '@/lib/hooks';
import { toMoneyString } from '@/utils';
import { api } from '@/utils/api';

export default function DashboardPage() {
  const { user } = useUser();

  const [selectedCollectionId, setSelectedCollectionId] = useAtom(
    selectedCollectionIdAtom
  );
  const { data: collections } = api.collections.getCollections.useQuery(
    undefined,
    { staleTime: Number.POSITIVE_INFINITY }
  );

  const { data: subscriptions, isInitialLoading: isSubsLoading } =
    api.subscriptions.getSubscriptionsFromCollection.useQuery(
      { collectionId: selectedCollectionId || '' },
      { enabled: selectedCollectionId !== null }
    );
  const { categories, isCategoriesLoading } = useCategories();
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

  function resetFilters() {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedMonth('ALL');
  }

  const selectedVisibleSubscriptions = React.useMemo(
    () =>
      visibleSubscriptions.filter((subscription) => rowSelection[subscription.id]),
    [rowSelection, visibleSubscriptions]
  );

  const subscriptionsForInsights =
    selectedVisibleSubscriptions.length > 0
      ? selectedVisibleSubscriptions
      : visibleSubscriptions;

  return (
    <MainLayout title="Dashboard | SubTrack">
      <h1 className="pt-4 pb-1 text-2xl">Dashboard</h1>
      <p className="text-muted-foreground">Track your subscriptions here.</p>
      <Separator className="mt-4 mb-6" />

      <div className="flex flex-row space-x-6">
        <div className="w-full">
          {isSubsLoading && (
            <div className="w-full space-y-2 p-2">
              <Skeleton className="h-12" />
              <div className="space-y-3 py-2">
                {[...new Array(7)].map((_, idx) => (
                  <Skeleton className="h-8" key={idx} />
                ))}
              </div>
              <Skeleton className="h-12" />
            </div>
          )}
          {!(isSubsLoading || subscriptions) && (
            <div className="flex w-full flex-row items-center justify-center gap-4">
              <LoadingSpinner />
              <span>Loading Your Dashboard</span>
            </div>
          )}
          {user &&
            !isSubsLoading &&
            subscriptions &&
            !isCategoriesLoading &&
            categories && (
              <DataTable
                categories={categories}
                columns={tableColumns}
                data={visibleSubscriptions}
                onResetFilters={resetFilters}
                onRowSelectionChange={setRowSelection}
                onSearchQueryChange={setSearchQuery}
                onSelectedCategoriesChange={setSelectedCategories}
                onSelectedMonthChange={setSelectedMonth}
                rowSelection={rowSelection}
                searchQuery={searchQuery}
                selectedCategories={selectedCategories}
                selectedMonth={selectedMonth}
              />
            )}
        </div>

        <div className="min-w-[245px]">
          <div className="flex flex-col space-y-4">
            {/* Statistic Cards */}
            {isSubsLoading &&
              Statistics.map((_, idx) => <SkeletonStatisticCard key={idx} />)}
            {!isSubsLoading &&
              subscriptions &&
              Statistics.map((item, idx) => (
                <StatisticCard
                  description={item.description}
                  key={idx}
                  value={item.getResult(subscriptionsForInsights)}
                />
              ))}

            {/* Monthly Cost Breakdown */}
            <Card>
              <Accordion
                collapsible
                defaultValue="monthly-cost-breakdown"
                type="single"
              >
                <AccordionItem value="monthly-cost-breakdown">
                  <AccordionTrigger className="px-4 py-2 font-semibold text-md">
                    Monthly Cost Breakdown
                  </AccordionTrigger>
                  {isSubsLoading && (
                    <AccordionContent>
                      {[...new Array(12)].map((_, idx) => (
                        <div
                          className="w-full odd:bg-white even:bg-slate-50"
                          key={idx}
                        >
                          <Skeleton className="w-full" />
                        </div>
                      ))}
                    </AccordionContent>
                  )}
                  {!isSubsLoading && subscriptions && (
                    <AccordionContent>
                      {getNextNMonths(12).map((data) => {
                        const monthStr = data.format('MMMM');
                        const month = data.month();
                        const year = data.year();
                        return (
                          <div
                            className="w-full odd:bg-white even:bg-slate-50"
                            key={`${monthStr}-${year}`}
                          >
                            <div className="flex flex-row px-4 py-1.5">
                              <span className="flex-1">{`${monthStr} ${year}`}</span>
                              <span>
                                {toMoneyString(
                                  getSubscriptionsInMonth(
                                    subscriptionsForInsights,
                                    month,
                                    year
                                  ).reduce((acc, sub) => acc + sub.amount, 0)
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </AccordionContent>
                  )}
                </AccordionItem>
              </Accordion>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
