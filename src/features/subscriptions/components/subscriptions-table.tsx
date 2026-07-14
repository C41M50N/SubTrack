import {
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type Table as TableInstance,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CategoryRecord } from '@/features/categories/queries';
import {
  createSubscriptionColumns,
  type SubscriptionColumnActions,
} from '@/features/subscriptions/components/subscription-columns';
import { SubscriptionsTableFooter } from '@/features/subscriptions/components/subscriptions-table-footer';
import { SubscriptionsTableToolbar } from '@/features/subscriptions/components/subscriptions-table-toolbar';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';

type UseSubscriptionsTableOptions = SubscriptionColumnActions & {
  data: SubscriptionRecord[];
};

export function useSubscriptionsTable({
  data,
  onEdit,
  onDelete,
}: UseSubscriptionsTableOptions) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'nextInvoiceDate', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo(
    () => createSubscriptionColumns({ onEdit, onDelete }),
    [onEdit, onDelete],
  );

  return useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, rowSelection },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });
}

type SubscriptionsTableProps = {
  table: TableInstance<SubscriptionRecord>;
  categories: CategoryRecord[];
  onBulkDelete: () => void;
};

export function SubscriptionsTable({
  table,
  categories,
  onBulkDelete,
}: SubscriptionsTableProps) {
  const rows = table.getRowModel().rows;
  const columnCount = table.getAllLeafColumns().length;

  return (
    <div className="flex flex-col gap-4">
      <SubscriptionsTableToolbar
        table={table}
        categories={categories}
        onBulkDelete={onBulkDelete}
      />

      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/40 hover:bg-muted/40"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-3">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  No subscriptions match your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SubscriptionsTableFooter table={table} />
    </div>
  );
}
