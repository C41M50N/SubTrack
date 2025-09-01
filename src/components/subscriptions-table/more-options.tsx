'use client';
import type { Table } from '@tanstack/react-table';
import { download, generateCsv, mkConfig } from 'export-to-csv';
import { useAtom } from 'jotai';
import { ImportIcon, SettingsIcon } from 'lucide-react';
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
import {
  selectedSubscriptionsAtom,
  tableSizeAtom,
} from '@/features/common/atoms';
import type { Subscription } from '@/features/subscriptions';
import dayjs from '@/lib/dayjs';
import { Switch } from '../ui/switch';

type MoreOptionsProps = {
  table: Table<Subscription>;
};

export default function MoreOptions(props: MoreOptionsProps) {
  const [tableSize, setTableSize] = useAtom(tableSizeAtom);
  const [subscriptions] = useAtom(selectedSubscriptionsAtom);

  function exportSubscriptionsToCSV() {
    const csvConfig = mkConfig({
      filename: `SubTrack Subscriptions - ${dayjs().format('YYYY-MM-DD')}`,
      useKeysAsHeaders: true,
    });

    const csv = generateCsv(csvConfig)(
      subscriptions
        .map(({ id, user_id, icon_ref, ...rest }) => rest)
        .map(({ next_invoice, last_invoice, ...rest }) => ({
          ...rest,
          next_invoice: dayjs(next_invoice).format('MM/DD/YYYY'),
          last_invoice:
            last_invoice !== null
              ? dayjs(last_invoice).format('MM/DD/YYYY')
              : '',
        }))
    );

    download(csvConfig)(csv);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-10 w-8 p-0" variant="outline">
          <SettingsIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
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
        <DropdownMenuItem onClick={() => {}}>
          <ImportIcon className="mr-2.5 size-4" />
          <span>Import Data</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportSubscriptionsToCSV}>
          <ImportIcon className="mr-2.5 size-4 rotate-180" />
          <span>Export Data</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
