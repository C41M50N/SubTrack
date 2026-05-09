import {
  IconAlarm,
  IconArrowsExchange,
  IconDotsVertical,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import type { Column, ColumnDef } from '@tanstack/react-table';
import { useAtom } from 'jotai';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react';
import Image from 'next/image';
import SetCancelReminderModal from '@/components/subscriptions/add-cancel-reminder-modal';
import DeleteSubscriptionModal from '@/components/subscriptions/delete-subscription-modal';
import EditSubscriptionModal from '@/components/subscriptions/edit-subscription-modal';
import MoveSubscriptionModal from '@/components/subscriptions/move-subscription-modal';
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
import type { CollectionWithoutUserId } from '@/features/collections';
import { tableSizeAtom } from '@/features/common/atoms';
import type { Subscription } from '@/features/subscriptions';
import { frequencyToDisplayText } from '@/features/subscriptions/utils';
import dayjs from '@/lib/dayjs';
import { useModalState } from '@/lib/hooks';
import { cn, toMoneyString, toProperCase } from '@/utils';

type SortableColumn = Column<Subscription, unknown>;

type SubscriptionColumnsOptions = {
  categories: string[];
  collections: CollectionWithoutUserId[];
};

function SortableHeader({
  column,
  title,
}: {
  column: SortableColumn;
  title: string;
}) {
  const sortDirection = column.getIsSorted();
  const SortIcon =
    sortDirection === 'asc'
      ? ArrowUpIcon
      : sortDirection === 'desc'
        ? ArrowDownIcon
        : ArrowUpDownIcon;

  return (
    <Button
      className="-ml-4"
      onClick={() => column.toggleSorting(sortDirection === 'asc')}
      variant="ghost"
    >
      {title}
      <SortIcon className="ml-2 size-4" />
    </Button>
  );
}

function SubscriptionNameCell({
  subscription,
}: {
  subscription: Subscription;
}) {
  const [tableSize] = useAtom(tableSizeAtom);
  const iconRef = subscription.icon_ref;
  const iconSize = tableSize === 'compact' ? 20 : 24;
  const iconSrc = iconRef.includes('.') ? `/${iconRef}` : `/${iconRef}.svg`;

  return (
    <div className="flex flex-row items-center gap-3">
      <Image
        alt={toProperCase(iconRef)}
        height={iconSize}
        src={iconSrc}
        width={iconSize}
      />
      <div
        className={cn(
          'font-medium',
          tableSize === 'compact' ? 'text-base' : 'text-lg'
        )}
      >
        {subscription.name}
      </div>
    </div>
  );
}

function SubscriptionAmountCell({
  subscription,
}: {
  subscription: Subscription;
}) {
  const [tableSize] = useAtom(tableSizeAtom);
  const formattedAmount = toMoneyString(subscription.amount);

  if (tableSize === 'compact') {
    return (
      <div className="flex flex-row items-end text-left">
        <div className="mr-0.5 font-semibold text-base leading-none">
          {formattedAmount}
        </div>
        <span className="mr-[1px] text-sm leading-none">/</span>
        <span className="text-xs leading-none">
          {frequencyToDisplayText(subscription.frequency, true)}
        </span>
      </div>
    );
  }

  return (
    <div className="text-left">
      <div className="font-semibold text-lg">{formattedAmount}</div>
      <span className="ml-1">
        every {frequencyToDisplayText(subscription.frequency)}
      </span>
    </div>
  );
}

function SubscriptionCategoryCell({
  subscription,
}: {
  subscription: Subscription;
}) {
  const [tableSize] = useAtom(tableSizeAtom);

  return (
    <Badge
      className={cn(tableSize === 'compact' ? 'text-xs' : 'text-md')}
      variant="secondary"
    >
      {subscription.category}
    </Badge>
  );
}

function SubscriptionNextInvoiceCell({
  subscription,
}: {
  subscription: Subscription;
}) {
  const [tableSize] = useAtom(tableSizeAtom);
  const formattedDate = dayjs(subscription.next_invoice).format('MMM D, YYYY');

  if (tableSize === 'compact') {
    return (
      <div className="text-left">
        <span className="font-medium text-sm">{formattedDate}</span>
      </div>
    );
  }

  return (
    <div className="text-left">
      <span className="font-medium text-[16px]">{formattedDate}</span>
      <p className="text-muted-foreground">
        ({dayjs(subscription.next_invoice).fromNow()})
      </p>
    </div>
  );
}

function SubscriptionActionsCell({
  subscription,
  categories,
  collections,
}: {
  subscription: Subscription;
  categories: string[];
  collections: CollectionWithoutUserId[];
}) {
  const deleteModalState = useModalState();
  const editModalState = useModalState();
  const addReminderModalState = useModalState();
  const moveModalState = useModalState();
  const hasMoveDestination = collections.length > 1;
  const moveDisabledMessage =
    'Create another collection to move subscriptions.';

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="size-8 p-0" variant="ghost">
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
            <span className="font-medium text-sm">Edit</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => addReminderModalState.setState('open')}
          >
            <IconAlarm className="mr-2.5 size-5" />
            <span className="font-medium text-sm">Add Reminder</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {hasMoveDestination ? (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => moveModalState.setState('open')}
            >
              <IconArrowsExchange className="mr-2.5 size-5" />
              <span className="font-medium text-sm">Move to Collection</span>
            </DropdownMenuItem>
          ) : (
            <div title={moveDisabledMessage}>
              <DropdownMenuItem disabled>
                <IconArrowsExchange className="mr-2.5 size-5" />
                <span className="font-medium text-sm">Move to Collection</span>
              </DropdownMenuItem>
            </div>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer text-red-700"
            onClick={() => deleteModalState.setState('open')}
          >
            <IconTrash className="mr-2.5 size-5" />
            <span className="font-medium text-sm">Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditSubscriptionModal
        categories={categories}
        collections={collections}
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
      <MoveSubscriptionModal
        collections={collections}
        state={moveModalState}
        subscription={subscription}
      />
    </div>
  );
}

export function createSubscriptionColumns({
  categories,
  collections,
}: SubscriptionColumnsOptions): ColumnDef<Subscription>[] {
  return [
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
        return <SortableHeader column={column} title="Name" />;
      },
      cell: ({ row }) => {
        return <SubscriptionNameCell subscription={row.original} />;
      },
      enableHiding: false,
    },
    {
      accessorKey: 'amount',
      header: 'Cost',
      cell: ({ row }) => {
        return <SubscriptionAmountCell subscription={row.original} />;
      },
    },
    {
      accessorKey: 'category',
      header: ({ column }) => {
        return <SortableHeader column={column} title="Category" />;
      },
      cell: ({ row }) => {
        return <SubscriptionCategoryCell subscription={row.original} />;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'next_invoice',
      header: ({ column }) => {
        return <SortableHeader column={column} title="Next Invoice" />;
      },
      cell: ({ row }) => {
        return <SubscriptionNextInvoiceCell subscription={row.original} />;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <SubscriptionActionsCell
            categories={categories}
            collections={collections}
            subscription={row.original}
          />
        );
      },
    },
  ];
}
