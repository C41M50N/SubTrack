import { IconCircleX, IconPlus } from '@tabler/icons-react';
import type { Table } from '@tanstack/react-table';
import { SearchInput } from '@/components/common/search-input';
import { Button } from '@/components/ui/button';
import CollectionSelector from '@/features/collections/components/collection-selector';
import type { Subscription } from '@/features/subscriptions';
import { useNewSubscriptionModal } from '@/features/subscriptions/stores';
import { DataTableFilter } from './data-table-filter';
import { MonthlyViewSelector } from './monthly-view-selector';
import MoreOptions from './more-options';

type Props = {
  table: Table<Subscription>;
  categories: string[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedCategories: string[];
  onSelectedCategoriesChange: (values: string[]) => void;
  selectedMonth: string;
  onSelectedMonthChange: (value: string) => void;
  onResetFilters: () => void;
};

export default function DataTableToolbar({
  table,
  categories,
  searchQuery,
  onSearchQueryChange,
  selectedCategories,
  onSelectedCategoriesChange,
  selectedMonth,
  onSelectedMonthChange,
  onResetFilters,
}: Props) {
  const newSubscriptionModalState = useNewSubscriptionModal();
  const isFiltered =
    searchQuery.trim().length > 0 ||
    selectedCategories.length > 0 ||
    selectedMonth !== 'ALL';

  return (
    <div className="flex items-end justify-between">
      <div className="flex flex-1 items-end space-x-2">
        <CollectionSelector />

        <MonthlyViewSelector
          onSelectedOptionChange={onSelectedMonthChange}
          selectedOption={selectedMonth}
        />

        <div className="flex flex-row space-x-2">
          <SearchInput
            className="h-10 w-[120px] bg-card lg:w-[150px]"
            onChange={(event) => onSearchQueryChange(event.target.value)}
            value={searchQuery}
          />
          <DataTableFilter
            onSelectedValuesChange={onSelectedCategoriesChange}
            options={categories.map((category) => ({
              label: category,
              value: category,
            }))}
            selectedValues={selectedCategories}
            title={isFiltered ? '' : 'Category'}
          />

          {isFiltered && (
            <Button
              className="h-10 bg-card px-2 lg:px-3"
              onClick={onResetFilters}
              variant="ghost"
            >
              Reset
              <IconCircleX className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-row space-x-2">
        <Button
          className="h-10"
          onClick={() => newSubscriptionModalState.set('open')}
          size="sm"
        >
          <IconPlus className="mr-2 size-4" />
          Add Subscription
        </Button>

        <MoreOptions table={table} />
      </div>
    </div>
  );
}
