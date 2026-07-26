import type { ColumnDef } from '@tanstack/react-table';
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  EllipsisIcon,
  PencilIcon,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SubscriptionIcon } from '@/features/subscriptions/components/subscription-icon';
import {
  effectiveMonthlyCents,
  formatCurrencyFromCents,
  frequencyUnit,
} from '@/features/subscriptions/cost';
import {
  formatInvoiceDate,
  formatInvoiceDistance,
} from '@/features/subscriptions/format';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';
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
  onDelete: (subscription: SubscriptionRecord) => void;
};

export function createSubscriptionColumns({
  onEdit,
  onDelete,
}: SubscriptionColumnActions): ColumnDef<SubscriptionRecord>[] {
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
    {
      accessorKey: 'nextInvoiceDate',
      header: ({ column }) => (
        <SortableHeader
          label="Next invoice"
          sorted={column.getIsSorted()}
          onToggle={() => column.toggleSorting(column.getIsSorted() === 'asc')}
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
