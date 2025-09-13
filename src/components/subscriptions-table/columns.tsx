import {
  IconAlarm,
  IconDotsVertical,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import type { ColumnDef } from '@tanstack/react-table';
import { useAtom } from 'jotai';
import Image from 'next/image';
import SetCancelReminderModal from '@/components/subscriptions/add-cancel-reminder-modal';
import DeleteSubscriptionModal from '@/components/subscriptions/delete-subscription-modal';
import EditSubscriptionModal from '@/components/subscriptions/edit-subscription-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { tableSizeAtom } from '@/features/common/atoms';
import type { Subscription } from '@/features/subscriptions';
import { frequencyToDisplayText } from '@/features/subscriptions/utils';
import dayjs from '@/lib/dayjs';
import {
  useCategories,
  useCollections,
  useModalState,
  useTableSortState,
} from '@/lib/hooks';
import { cn, toMoneyString, toProperCase } from '@/utils';

export const columns: ColumnDef<Subscription>[] = [
  {
    id: 'id',
    accessorKey: 'id',
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'select',
    header: ({ table }) => {
      return (
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          className="mt-1"
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
          }}
        />
      );
    },
    cell: ({ row }) => {
      return (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          className="mt-1"
          onCheckedChange={(value) => {
            row.toggleSelected(!!value);
          }}
        />
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const { toggleSorting, SortIcon } = useTableSortState(column);
      return (
        <Button className="-ml-4" onClick={toggleSorting} variant="ghost">
          Name
          {SortIcon && <SortIcon className="ml-2 h-4 w-4" />}
        </Button>
      );
    },
    cell: ({ row }) => {
      const icon_ref = row.original.icon_ref;
      const [tableSize] = useAtom(tableSizeAtom);
      return (
        <div className="flex flex-row items-center space-x-3">
          {icon_ref.includes('.') ? (
            <Image
              alt={toProperCase(icon_ref)}
              height={tableSize === 'compact' ? 20 : 24}
              src={`/${icon_ref}`}
              width={tableSize === 'compact' ? 20 : 24}
            />
          ) : (
            <Image
              alt={toProperCase(icon_ref)}
              height={tableSize === 'compact' ? 20 : 24}
              src={`/${icon_ref}.svg`}
              width={tableSize === 'compact' ? 20 : 24}
            />
          )}
          <div
            className={cn(
              'font-medium',
              tableSize === 'compact' ? 'text-base' : 'text-lg'
            )}
          >
            {row.original.name}
          </div>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: 'amount',
    header: 'Cost',
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue('amount'));
      const formatted = toMoneyString(amount);
      const [tableSize] = useAtom(tableSizeAtom);

      if (tableSize === 'compact') {
        return (
          <div className="flex flex-row items-end text-left">
            <div className="mr-0.5 font-semibold text-base leading-none">
              {formatted}
            </div>
            <span className="mr-[1px] text-sm leading-none">/</span>
            <span className="text-xs leading-none">
              {frequencyToDisplayText(row.original.frequency, true)}
            </span>
          </div>
        );
      }

      return (
        <div className="text-left">
          <div className={cn('font-semibold text-lg')}>{formatted}</div>
          <span className="ml-1">
            every {frequencyToDisplayText(row.original.frequency)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'category',
    header: ({ column }) => {
      const { toggleSorting, SortIcon } = useTableSortState(column);

      return (
        <Button className="-ml-4" onClick={toggleSorting} variant="ghost">
          Category
          {SortIcon && <SortIcon className="ml-2 h-4 w-4" />}
        </Button>
      );
    },
    cell: ({ row }) => {
      const [tableSize] = useAtom(tableSizeAtom);
      return (
        <Badge
          className={cn(tableSize === 'compact' ? 'text-xs' : 'text-md')}
          variant={'secondary'}
        >
          {row.original.category}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'next_invoice',
    header: ({ column }) => {
      const { toggleSorting, SortIcon } = useTableSortState(column);
      return (
        <Button className="-ml-4" onClick={toggleSorting} variant="ghost">
          Next Invoice
          {SortIcon && <SortIcon className="ml-2 h-4 w-4" />}
        </Button>
      );
    },
    cell: ({ row }) => {
      const [tableSize] = useAtom(tableSizeAtom);

      if (tableSize === 'compact') {
        return (
          <div className="text-left">
            <span className="font-medium text-sm">
              {dayjs(row.original.next_invoice).format('MMM D, YYYY')}
            </span>
          </div>
        );
      }

      return (
        <div className="text-left">
          <span className="font-medium text-[16px]">
            {dayjs(row.original.next_invoice).format('MMM D, YYYY')}
          </span>
          <p className="text-muted-foreground">
            ({dayjs(row.original.next_invoice).fromNow()})
          </p>
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const subscription = row.original;

      const { categories } = useCategories();
      const { collections } = useCollections();

      const deleteModalState = useModalState();
      const editModalState = useModalState();
      const addReminderModalState = useModalState();

      return (
        <div key={subscription.id}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8 p-0" variant="ghost">
                <span className="sr-only">Open menu</span>
                <IconDotsVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" alignOffset={-6} side="right">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => editModalState.setState('open')}
              >
                <IconPencil className="mr-2.5 size-5" />
                <span className={'font-medium text-sm'}>Edit</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => addReminderModalState.setState('open')}
              >
                <IconAlarm className="mr-2.5 size-5" />
                <span className={'font-medium text-sm'}>Add Reminder</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer text-red-700"
                onClick={() => deleteModalState.setState('open')}
              >
                <IconTrash className="mr-2.5 size-5" />
                <span className={'font-medium text-sm'}>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <EditSubscriptionModal
            categories={categories || []}
            collections={collections || []}
            state={editModalState}
            subscription={subscription}
          />
          <DeleteSubscriptionModal
            state={deleteModalState}
            subscription_id={subscription.id}
            subscription_name={subscription.name}
          />
          <SetCancelReminderModal
            state={addReminderModalState}
            subscription={subscription}
          />
        </div>
      );
    },
  },
];
