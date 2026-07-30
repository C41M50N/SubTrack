import { Link } from '@tanstack/react-router';
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  SearchIcon,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { InvoiceItem, InvoiceView } from '@/features/invoices/domain';
import { summarizeInvoices } from '@/features/invoices/domain';
import { CategoryFilter } from '@/features/subscriptions/components/category-filter';
import { SubscriptionIcon } from '@/features/subscriptions/components/subscription-icon';
import {
  formatCurrencyFromCents,
  frequencyUnit,
} from '@/features/subscriptions/cost';
import {
  formatInvoiceDate,
  formatInvoiceDistance,
} from '@/features/subscriptions/format';
import { cn } from '@/lib/utils';

type SortKey = 'name' | 'category' | 'amount' | 'date';
type SortState = { key: SortKey; desc: boolean };

function defaultSort(view: InvoiceView): SortState {
  return { key: 'date', desc: view === 'history' };
}

function compareInvoices(
  a: InvoiceItem,
  b: InvoiceItem,
  sort: SortState,
): number {
  let primary = 0;

  switch (sort.key) {
    case 'name':
      primary = a.name.localeCompare(b.name);
      break;
    case 'category':
      primary = a.category.localeCompare(b.category);
      break;
    case 'amount':
      primary = a.amount - b.amount;
      break;
    case 'date':
      primary = a.date.localeCompare(b.date);
      break;
  }

  if (primary !== 0) {
    return sort.desc ? -primary : primary;
  }

  return (
    b.amount - a.amount ||
    a.name.localeCompare(b.name) ||
    a.id.localeCompare(b.id)
  );
}

function SortButton({
  label,
  column,
  sort,
  onChange,
  align = 'start',
}: {
  label: string;
  column: SortKey;
  sort: SortState;
  onChange: (sort: SortState) => void;
  align?: 'start' | 'end';
}) {
  const active = sort.key === column;
  const Icon = !active
    ? ArrowUpDownIcon
    : sort.desc
      ? ArrowDownIcon
      : ArrowUpIcon;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-mx-2.5 h-8 gap-1.5', align === 'end' && 'ml-auto')}
      onClick={() =>
        onChange({ key: column, desc: active ? !sort.desc : false })
      }
    >
      {label}
      <Icon className={cn('size-3.5', !active && 'text-muted-foreground')} />
    </Button>
  );
}

type InvoiceTableProps = {
  view: InvoiceView;
  monthLabel: string;
  invoices: InvoiceItem[];
  collectionId: string;
  onViewChange: (view: InvoiceView) => void;
  isLoading: boolean;
  isError: boolean;
  hasActiveSubscriptions: boolean;
  onRetry: () => void;
};

export function InvoiceTable({
  view,
  monthLabel,
  invoices,
  collectionId,
  onViewChange,
  isLoading,
  isError,
  hasActiveSubscriptions,
  onRetry,
}: InvoiceTableProps) {
  const initialSort = defaultSort(view);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<SortState>(initialSort);

  const categoryOptions = [
    ...new Set(invoices.map((invoice) => invoice.category)),
  ]
    .sort((a, b) => a.localeCompare(b))
    .map((category) => ({ id: category, name: category }));
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredInvoices = invoices
    .filter(
      (invoice) =>
        !normalizedSearch ||
        invoice.name.toLocaleLowerCase().includes(normalizedSearch),
    )
    .filter(
      (invoice) =>
        categories.length === 0 || categories.includes(invoice.category),
    )
    .sort((a, b) => compareInvoices(a, b, sort));
  const summary = summarizeInvoices(filteredInvoices);
  const hasFilters = search !== '' || categories.length > 0;
  const hasCustomSort =
    sort.key !== initialSort.key || sort.desc !== initialSort.desc;

  function reset() {
    setSearch('');
    setCategories([]);
    setSort(initialSort);
  }

  function sortAria(column: SortKey): 'ascending' | 'descending' | 'none' {
    if (sort.key !== column) return 'none';
    return sort.desc ? 'descending' : 'ascending';
  }

  const columnCount = 4;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex rounded-lg bg-muted p-1 ring-1 ring-foreground/10"
          role="group"
          aria-label="Invoice view"
        >
          {(['upcoming', 'history'] as const).map((option) => (
            <Button
              key={option}
              aria-pressed={view === option}
              variant="ghost"
              size="sm"
              className={cn(
                'min-w-24 capitalize',
                view === option &&
                  'bg-background shadow-xs hover:bg-background',
              )}
              onClick={() => onViewChange(option)}
            >
              {option === 'history' ? 'History' : 'Upcoming'}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-56">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoices"
            className="pl-8"
            aria-label="Search invoices by subscription name"
          />
        </div>
        <CategoryFilter
          options={categoryOptions}
          selected={categories}
          onChange={setCategories}
        />
      </div>

      <ScrollArea className="min-h-56 flex-1 rounded-xl ring-1 ring-foreground/10">
        <Table containerClassName="overflow-visible" className="min-w-[42rem]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="sticky top-0 z-10 bg-muted-solid px-3 shadow-[inset_0_-1px_0_var(--border)]"
                aria-sort={sortAria('name')}
              >
                <SortButton
                  label="Subscription"
                  column="name"
                  sort={sort}
                  onChange={setSort}
                />
              </TableHead>
              <TableHead
                className="sticky top-0 z-10 bg-muted-solid px-3 shadow-[inset_0_-1px_0_var(--border)]"
                aria-sort={sortAria('category')}
              >
                <SortButton
                  label="Category"
                  column="category"
                  sort={sort}
                  onChange={setSort}
                />
              </TableHead>
              <TableHead
                className="sticky top-0 z-10 bg-muted-solid px-3 text-right shadow-[inset_0_-1px_0_var(--border)]"
                aria-sort={sortAria('amount')}
              >
                <SortButton
                  label="Amount"
                  column="amount"
                  sort={sort}
                  onChange={setSort}
                  align="end"
                />
              </TableHead>
              <TableHead
                className="sticky top-0 z-10 bg-muted-solid px-3 pr-4 shadow-[inset_0_-1px_0_var(--border)]"
                aria-sort={sortAria('date')}
              >
                <SortButton
                  label={view === 'upcoming' ? 'Expected date' : 'Invoice date'}
                  column="date"
                  sort={sort}
                  onChange={setSort}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, index) => (
                <TableRow key={index} className="hover:bg-transparent">
                  <TableCell colSpan={columnCount} className="px-3 py-3">
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableMessage colSpan={columnCount}>
                <p>
                  {view === 'history'
                    ? 'Invoice history could not be loaded.'
                    : 'The upcoming schedule could not be loaded.'}
                </p>
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              </TableMessage>
            ) : filteredInvoices.length === 0 ? (
              <TableMessage colSpan={columnCount}>
                {hasFilters ? (
                  <>
                    <p>No invoices match the current filters.</p>
                    <Button variant="outline" size="sm" onClick={reset}>
                      Reset
                    </Button>
                  </>
                ) : view === 'upcoming' && !hasActiveSubscriptions ? (
                  <>
                    <p>
                      Add an active subscription to create an upcoming schedule.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      render={
                        <Link
                          to="/c/$collectionId/subscriptions"
                          params={{ collectionId }}
                        />
                      }
                    >
                      View subscriptions
                    </Button>
                  </>
                ) : (
                  <p>
                    {view === 'upcoming'
                      ? `No invoices are expected in ${monthLabel}.`
                      : `No invoices were recorded in ${monthLabel}.`}
                  </p>
                )}
              </TableMessage>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <SubscriptionIcon
                        domain={invoice.iconRef}
                        name={invoice.name}
                        size="md"
                      />
                      <span className="font-medium">{invoice.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge variant="secondary">{invoice.category}</Badge>
                  </TableCell>
                  <TableCell
                    className="px-3 py-2.5 text-right font-medium tabular-nums"
                    aria-label={`${(invoice.amount / 100).toFixed(2)} US dollars`}
                  >
                    {formatCurrencyFromCents(invoice.amount)}
                    {invoice.kind === 'upcoming' ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        {frequencyUnit(invoice.frequency)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 pr-4">
                    <div className="flex flex-col">
                      <span>{formatInvoiceDate(invoice.date)}</span>
                      {view === 'upcoming' ? (
                        <span className="text-xs text-muted-foreground">
                          {formatInvoiceDistance(invoice.date)}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {summary.count} {view === 'upcoming' ? 'upcoming' : 'recorded'}{' '}
          {summary.count === 1 ? 'invoice' : 'invoices'} ·{' '}
          <span
            aria-label={`${(summary.totalCents / 100).toFixed(2)} US dollars`}
          >
            {formatCurrencyFromCents(summary.totalCents)}
          </span>{' '}
          in {monthLabel}
        </span>
        {hasFilters || hasCustomSort ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function TableMessage({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        colSpan={colSpan}
        className="h-40 text-center text-muted-foreground"
      >
        <div className="flex flex-col items-center justify-center gap-3">
          {children}
        </div>
      </TableCell>
    </TableRow>
  );
}
