'use client';
import type { Table } from '@tanstack/react-table';
import { useAtom } from 'jotai';
import { DownloadIcon, ImportIcon, SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { tableSizeAtom } from '@/features/common/atoms';
import type { Subscription } from '@/features/subscriptions';
import {
  useDownloadCSVModalState,
  useExportDataModalState,
  useImportDataModalState,
  useManageCategoriesModalState,
} from '@/features/subscriptions/stores';
import { Switch } from '../ui/switch';

type MoreOptionsProps = {
  table: Table<Subscription>;
};

export default function MoreOptions(props: MoreOptionsProps) {
  const [tableSize, setTableSize] = useAtom(tableSizeAtom);
  const manageCategoriesModalState = useManageCategoriesModalState();
  const exportDataModalState = useExportDataModalState();
  const importDataModalState = useImportDataModalState();
  const downloadCSVModalState = useDownloadCSVModalState();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-10 w-8 p-0" variant="outline">
          <SettingsIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        {props.table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' &&
              column.getCanHide() &&
              column.id !== 'id'
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                checked={column.getIsVisible()}
                className="capitalize"
                key={column.id}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={(e) => e.preventDefault()}
              >
                {column.id.replaceAll('_', ' ')}
              </DropdownMenuCheckboxItem>
            );
          })}

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Table Size</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() =>
            setTableSize(tableSize === 'compact' ? 'default' : 'compact')
          }
          onSelect={(e) => e.preventDefault()}
        >
          <div className="flex flex-row items-center gap-4 pl-1">
            <Switch checked={tableSize === 'compact'} size="sm" />
            <span>{tableSize === 'default' ? 'Default' : 'Compact'}</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Options</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => importDataModalState.set('open')}>
          <ImportIcon className="mr-2.5 size-4" />
          <span>Import Data</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportDataModalState.set('open')}>
          <ImportIcon className="mr-2.5 size-4 rotate-180" />
          <span>Export Data</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadCSVModalState.set('open')}>
          <DownloadIcon className="mr-2.5 size-4" />
          <span>Download CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => manageCategoriesModalState.set('open')}
        >
          <SettingsIcon className="mr-2.5 size-4" />
          <span>Manage Categories</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
