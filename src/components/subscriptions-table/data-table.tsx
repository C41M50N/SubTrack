import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type RowSelectionState,
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
  tableSizeAtom,
} from '@/features/common/atoms';
import type { Subscription } from '@/features/subscriptions';
import { cn } from '@/utils';
import DataTableToolbar from './data-table-toolbar';

type DataTableProps = {
  columns: ColumnDef<Subscription>[];
  data: Subscription[];
  categories: string[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedCategories: string[];
  onSelectedCategoriesChange: (values: string[]) => void;
  selectedMonth: string;
  onSelectedMonthChange: (value: string) => void;
  onResetFilters: () => void;
  rowSelection: RowSelectionState;
  onRowSelectionChange: (rowSelection: RowSelectionState) => void;
};

export default function DataTable({
  columns,
  data,
  categories,
  searchQuery,
  onSearchQueryChange,
  selectedCategories,
  onSelectedCategoriesChange,
  selectedMonth,
  onSelectedMonthChange,
  onResetFilters,
  rowSelection,
  onRowSelectionChange,
}: DataTableProps) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ id: false });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: (updater) => {
      const nextRowSelection =
        typeof updater === 'function' ? updater(rowSelection) : updater;
      onRowSelectionChange(nextRowSelection);
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
    },
  });

  const [tableSize] = useAtom(tableSizeAtom);

  return (
    <div className="space-y-4">
      <DataTableToolbar
        categories={categories}
        onResetFilters={onResetFilters}
        onSearchQueryChange={onSearchQueryChange}
        onSelectedCategoriesChange={onSelectedCategoriesChange}
        onSelectedMonthChange={onSelectedMonthChange}
        searchQuery={searchQuery}
        selectedCategories={selectedCategories}
        selectedMonth={selectedMonth}
        table={table}
      />

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
            {table.getSelectedRowModel().rows.length} of {table.getRowModel().rows.length}{' '}
            row(s) selected
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
