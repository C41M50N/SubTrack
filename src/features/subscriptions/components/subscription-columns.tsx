import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  CirclePauseIcon,
  EllipsisIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react';

import { MenuActionItem } from '@/components/menu-action-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CollectionRecord } from '@/features/collections/queries';
import { MoveToSubmenu } from '@/features/subscriptions/components/move-subscriptions';
import { SubscriptionIcon } from '@/features/subscriptions/components/subscription-icon';
import {
  effectiveMonthlyCents,
  formatCurrencyFromCents,
  frequencyUnit,
} from '@/features/subscriptions/cost';
import {
  formatDeactivatedDate,
  formatDeactivatedDateTime,
  formatInvoiceDate,
  formatInvoiceDistance,
} from '@/features/subscriptions/format';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';
import type { SubscriptionView } from '@/features/subscriptions/search';
import { cn } from '@/lib/utils';

type SortableHeaderProps = {
  label: string;
  sorted: false | 'asc' | 'desc';
  onToggle: (event: React.MouseEvent) => void;
  align?: 'start' | 'end';
};

function SortableHeader({
  label,
  sorted,
  onToggle,
  align = 'start',
}: SortableHeaderProps) {
  const Icon =
    sorted === 'asc'
      ? ArrowUpIcon
      : sorted === 'desc'
        ? ArrowDownIcon
        : ArrowUpDownIcon;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={cn(
        '-mx-2.5 h-8 gap-1.5 data-[sorted=true]:text-foreground',
        align === 'end' && 'ml-auto',
      )}
      data-sorted={sorted !== false}
    >
      {label}
      <Icon
        className={cn('size-3.5', sorted === false && 'text-muted-foreground')}
      />
    </Button>
  );
}

export type SubscriptionColumnActions = {
  onEdit: (subscription: SubscriptionRecord) => void;
  onMove: (subscription: SubscriptionRecord, target: CollectionRecord) => void;
  onDeactivate: (subscription: SubscriptionRecord) => void;
  onReactivate: (subscription: SubscriptionRecord) => void;
  onDelete: (subscription: SubscriptionRecord) => void;
};

export function createSubscriptionColumns(
  {
    onEdit,
    onMove,
    onDeactivate,
    onReactivate,
    onDelete,
  }: SubscriptionColumnActions,
  view: SubscriptionView,
  moveTargets: CollectionRecord[],
): ColumnDef<SubscriptionRecord>[] {
  return [
    {
      id: 'select',
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(checked) =>
            table.toggleAllPageRowsSelected(checked === true)
          }
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          aria-label={`Select ${row.original.name}`}
        />
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <SortableHeader
          label="Name"
          sorted={column.getIsSorted()}
          onToggle={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <SubscriptionIcon
            domain={row.original.iconRef}
            name={row.original.name}
            size="md"
          />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
      filterFn: 'includesString',
      sortingFn: (a, b) => a.original.name.localeCompare(b.original.name),
    },
    {
      id: 'category',
      accessorFn: (row) => row.categoryId ?? '',
      header: 'Category',
      cell: ({ row }) =>
        row.original.category ? (
          <Badge variant="secondary">{row.original.category}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Uncategorized</span>
        ),
      filterFn: (row, columnId, filterValue: string[]) => {
        if (!filterValue?.length) {
          return true;
        }

        return filterValue.includes(row.getValue(columnId));
      },
    },
    {
      id: 'cost',
      accessorFn: (row) => effectiveMonthlyCents(row),
      header: ({ column }) => (
        <SortableHeader
          label="Cost"
          sorted={column.getIsSorted()}
          onToggle={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        />
      ),
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger
            render={<span className="font-medium tabular-nums" />}
          >
            {formatCurrencyFromCents(row.original.costAmount)}
            <span className="text-xs font-normal text-muted-foreground">
              {frequencyUnit(row.original.costFrequency)}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {formatCurrencyFromCents(effectiveMonthlyCents(row.original))}
            {frequencyUnit('monthly')} effective
          </TooltipContent>
        </Tooltip>
      ),
    },
    view === 'active'
      ? {
          accessorKey: 'nextInvoiceDate',
          header: ({ column }) => (
            <SortableHeader
              label="Next invoice"
              sorted={column.getIsSorted()}
              onToggle={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
            />
          ),
          cell: ({ row }) => (
            <div className="flex flex-col">
              <span>{formatInvoiceDate(row.original.nextInvoiceDate)}</span>
              <span className="text-xs text-muted-foreground">
                {formatInvoiceDistance(row.original.nextInvoiceDate)}
              </span>
            </div>
          ),
        }
      : {
          accessorKey: 'deactivatedAt',
          header: ({ column }) => (
            <SortableHeader
              label="Deactivated"
              sorted={column.getIsSorted()}
              onToggle={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
            />
          ),
          cell: ({ row }) =>
            row.original.deactivatedAt ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      className="cursor-help text-left tabular-nums"
                    />
                  }
                >
                  <time
                    dateTime={new Date(
                      row.original.deactivatedAt,
                    ).toISOString()}
                  >
                    {formatDeactivatedDate(row.original.deactivatedAt)}
                  </time>
                </TooltipTrigger>
                <TooltipContent>
                  {formatDeactivatedDateTime(row.original.deactivatedAt)}
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-muted-foreground">Unknown</span>
            ),
          sortingFn: (a, b) => {
            const aTime = a.original.deactivatedAt
              ? new Date(a.original.deactivatedAt).getTime()
              : 0;
            const bTime = b.original.deactivatedAt
              ? new Date(b.original.deactivatedAt).getTime()
              : 0;
            return aTime - bTime;
          },
        },
    {
      id: 'actions',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${row.original.name}`}
                />
              }
            >
              <EllipsisIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onEdit(row.original)}>
                  <MenuActionItem icon={PencilIcon} label="Edit" />
                </DropdownMenuItem>
                <MoveToSubmenu
                  targets={moveTargets}
                  onSelect={(target) => onMove(row.original, target)}
                />
                {view === 'active' ? (
                  <DropdownMenuItem onClick={() => onDeactivate(row.original)}>
                    <MenuActionItem icon={CirclePauseIcon} label="Deactivate" />
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onReactivate(row.original)}>
                    <MenuActionItem icon={RotateCcwIcon} label="Reactivate" />
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(row.original)}
                >
                  <MenuActionItem
                    variant="destructive"
                    icon={Trash2Icon}
                    label="Delete"
                  />
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
