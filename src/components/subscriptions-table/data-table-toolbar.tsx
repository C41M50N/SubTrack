import { IconCircleX, IconPlus } from '@tabler/icons-react';
import type { Table } from '@tanstack/react-table';
import type { Subscription } from '@/features/subscriptions';
import { useNewSubscriptionModal } from '@/features/subscriptions/stores';
import CollectionSelector from '../collections/collection-selector';
import { SearchInput } from '../common/search-input';
import { Button } from '../ui/button';
import { DataTableFilter } from './data-table-filter';
import { MonthlyViewSelector } from './monthly-view-selector';
import MoreOptions from './more-options';

type Props = {
  table: Table<Subscription>;
  categories: string[];
  data: Subscription[];
};

export default function DataTableToolbar({ table, categories, data }: Props) {
  const newSubscriptionModalState = useNewSubscriptionModal();
  const isFiltered =
    table.getState().columnFilters.length > 0 &&
    table.getState().columnFilters.some((filter) => filter.id !== 'id');

  return (
    <div className="flex items-end justify-between">
      <div className="flex flex-1 items-end space-x-2">
        <CollectionSelector />

        <MonthlyViewSelector subscriptions={data} table={table} />

        <div className="flex flex-row space-x-2">
          <SearchInput
            className="h-10 w-[120px] lg:w-[150px]"
            onChange={(event) =>
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          />
          {table.getColumn('category') && (
            <DataTableFilter
              column={table.getColumn('category')}
              options={categories.map((cat) => ({ label: cat, value: cat }))}
              title={isFiltered ? '' : 'Category'}
            />
          )}

          {isFiltered && (
            <Button
              className="h-10 px-2 lg:px-3"
              onClick={() => {
                const currentFilters = table.getState().columnFilters;
                const idFilter = currentFilters.find(
                  (filter) => filter.id === 'id'
                );
                table.setColumnFilters(idFilter ? [idFilter] : []);
              }}
              variant="ghost"
            >
              Reset
              <IconCircleX className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-row space-x-2">
        {/* Add Subscription Button */}
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
