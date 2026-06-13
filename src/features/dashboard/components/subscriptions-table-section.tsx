import type { RowSelectionState } from '@tanstack/react-table';
import React from 'react';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';
import type { CollectionWithoutUserId } from '@/features/collections';
import { createSubscriptionColumns } from '@/features/dashboard/components/subscriptions-table/columns';
import DataTable from '@/features/dashboard/components/subscriptions-table/data-table';
import type { Subscription } from '@/features/subscriptions';

const TABLE_SKELETON_ROW_KEYS = [
  'table-skeleton-row-1',
  'table-skeleton-row-2',
  'table-skeleton-row-3',
  'table-skeleton-row-4',
  'table-skeleton-row-5',
  'table-skeleton-row-6',
  'table-skeleton-row-7',
] as const;

type SubscriptionsTableSectionProps = {
  categories: string[];
  collections: CollectionWithoutUserId[];
  data: Subscription[];
  isCategoriesLoading: boolean;
  isSubscriptionsLoading: boolean;
  rowSelection: RowSelectionState;
  searchQuery: string;
  selectedCategories: string[];
  selectedMonth: string;
  showTable: boolean;
  onResetFilters: () => void;
  onRowSelectionChange: (rowSelection: RowSelectionState) => void;
  onSearchQueryChange: (value: string) => void;
  onSelectedCategoriesChange: (values: string[]) => void;
  onSelectedMonthChange: (value: string) => void;
};

export function SubscriptionsTableSection({
  categories,
  collections,
  data,
  isCategoriesLoading,
  isSubscriptionsLoading,
  rowSelection,
  searchQuery,
  selectedCategories,
  selectedMonth,
  showTable,
  onResetFilters,
  onRowSelectionChange,
  onSearchQueryChange,
  onSelectedCategoriesChange,
  onSelectedMonthChange,
}: SubscriptionsTableSectionProps) {
  const columns = React.useMemo(
    () => createSubscriptionColumns({ categories, collections }),
    [categories, collections]
  );

  if (isSubscriptionsLoading) {
    return (
      <div className="w-full space-y-2 p-2">
        <Skeleton className="h-12" />
        <div className="space-y-3 py-2">
          {TABLE_SKELETON_ROW_KEYS.map((key) => (
            <Skeleton className="h-8" key={key} />
          ))}
        </div>
        <Skeleton className="h-12" />
      </div>
    );
  }

  if (!showTable) {
    return (
      <div className="flex w-full flex-row items-center justify-center gap-4">
        <LoadingSpinner />
        <span>Loading Your Dashboard</span>
      </div>
    );
  }

  if (isCategoriesLoading) {
    return null;
  }

  return (
    <DataTable
      categories={categories}
      columns={columns}
      data={data}
      onResetFilters={onResetFilters}
      onRowSelectionChange={onRowSelectionChange}
      onSearchQueryChange={onSearchQueryChange}
      onSelectedCategoriesChange={onSelectedCategoriesChange}
      onSelectedMonthChange={onSelectedMonthChange}
      rowSelection={rowSelection}
      searchQuery={searchQuery}
      selectedCategories={selectedCategories}
      selectedMonth={selectedMonth}
    />
  );
}
