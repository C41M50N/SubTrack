import type { Table } from '@tanstack/react-table';
import { SearchIcon, Trash2Icon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CategoryRecord } from '@/features/categories/queries';
import { CategoryFilter } from '@/features/subscriptions/components/category-filter';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';

type SubscriptionsTableToolbarProps = {
  table: Table<SubscriptionRecord>;
  categories: CategoryRecord[];
  onBulkDelete: () => void;
};

export function SubscriptionsTableToolbar({
  table,
  categories,
  onBulkDelete,
}: SubscriptionsTableToolbarProps) {
  const nameColumn = table.getColumn('name');
  const categoryColumn = table.getColumn('category');

  const nameFilter = (nameColumn?.getFilterValue() as string) ?? '';
  const selectedCategories =
    (categoryColumn?.getFilterValue() as string[]) ?? [];
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:max-w-56">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={nameFilter}
          onChange={(event) => nameColumn?.setFilterValue(event.target.value)}
          placeholder="Search subscriptions"
          className="pl-8"
          aria-label="Search subscriptions by name"
        />
      </div>

      <CategoryFilter
        options={categories}
        selected={selectedCategories}
        onChange={(next) =>
          categoryColumn?.setFilterValue(next.length ? next : undefined)
        }
      />

      {selectedCount > 0 && (
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
          <Button variant="destructive" size="sm" onClick={onBulkDelete}>
            <Trash2Icon className="size-4" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetRowSelection()}
          >
            <XIcon className="size-4" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
