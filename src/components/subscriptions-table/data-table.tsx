import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import { useAtom } from 'jotai';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  selectedSubscriptionsAtom,
  tableSizeAtom,
} from '@/features/common/atoms';
import type { Subscription } from '@/features/subscriptions';
import { cn } from '@/utils';
import DataTableToolbar from './data-table-toolbar';

interface DataTableProps {
  columns: ColumnDef<Subscription>[];
  data: Subscription[];
  categories: string[];
}

export default function DataTable({
  columns,
  data,
  categories,
}: DataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ id: false });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onStateChange: onTableChange,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      columnFilters,
    },
  });

  const [tableSize] = useAtom(tableSizeAtom);
  const [_, setSelectedSubscriptions] = useAtom(selectedSubscriptionsAtom);

  function onTableChange() {
    const selectedRows =
      table.getFilteredSelectedRowModel().rows.length > 0
        ? table.getFilteredSelectedRowModel().rows
        : table.getFilteredRowModel().rows;

    const subscriptions = selectedRows.map((row) => row.original);
    setSelectedSubscriptions(subscriptions);
  }

  React.useEffect(() => {
    onTableChange();
  }, [rowSelection, columnFilters, sorting]);

  return (
    <div className="space-y-4">
      <DataTableToolbar categories={categories} data={data} table={table} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() && 'selected'}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      className={cn(
                        tableSize === 'compact' && 'py-1 pr-1 pl-4'
                      )}
                      key={cell.id}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center text-gray-500"
                  colSpan={columns.length}
                >
                  You're not tracking any subscriptions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex w-full flex-row items-center bg-primary-foreground px-4 py-2 text-left text-md text-muted-foreground">
          <span>
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected
          </span>
          <Button
            className="ml-auto"
            onClick={() => table.resetSorting()}
            type="button"
            variant="outline"
          >
            Clear Sorting
          </Button>
        </div>
      </div>
    </div>
  );
}
