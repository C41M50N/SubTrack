import type { Table } from '@tanstack/react-table';
import { RotateCcwIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';

type SubscriptionsTableFooterProps = {
  table: Table<SubscriptionRecord>;
};

export function SubscriptionsTableFooter({
  table,
}: SubscriptionsTableFooterProps) {
  const visibleCount = table.getFilteredRowModel().rows.length;
  const totalCount = table.getCoreRowModel().rows.length;

  const isFiltered = table.getState().columnFilters.length > 0;
  const isSorted = table.getState().sorting.length > 0;
  const hasSelection = table.getFilteredSelectedRowModel().rows.length > 0;
  const canReset = isFiltered || isSorted || hasSelection;

  function handleReset() {
    table.resetColumnFilters();
    table.resetSorting();
    table.resetRowSelection();
  }

  return (
    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>
        Showing{' '}
        <span className="font-medium text-foreground">{visibleCount}</span> of{' '}
        {totalCount} {totalCount === 1 ? 'subscription' : 'subscriptions'}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        disabled={!canReset}
      >
        <RotateCcwIcon className="size-4" />
        Reset
      </Button>
    </div>
  );
}
