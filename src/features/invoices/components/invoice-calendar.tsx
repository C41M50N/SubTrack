import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InvoiceItem, InvoiceView } from '@/features/invoices/domain';
import {
  getDefaultSelectedDate,
  groupInvoicesByDate,
  summarizeInvoices,
  toDateKey,
} from '@/features/invoices/domain';
import { SubscriptionIcon } from '@/features/subscriptions/components/subscription-icon';
import { formatCurrencyFromCents } from '@/features/subscriptions/cost';
import { formatInvoiceDate } from '@/features/subscriptions/format';
import { cn } from '@/lib/utils';

type InvoiceCalendarProps = {
  view: InvoiceView;
  month: string;
  monthLabel: string;
  invoices: InvoiceItem[];
  isLoading: boolean;
  isError: boolean;
  startMonth?: Date;
  endMonth?: Date;
  onMonthChange: (month: Date) => void;
  now: Date;
};

export function InvoiceCalendar({
  view,
  month,
  monthLabel,
  invoices,
  isLoading,
  isError,
  startMonth,
  endMonth,
  onMonthChange,
  now,
}: InvoiceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(() =>
    getDefaultSelectedDate(month, invoices, now),
  );
  const groupedInvoices = groupInvoicesByDate(invoices);
  const monthSummary = summarizeInvoices(invoices);
  const activeMonth = parseISO(`${month}-01`);
  const agenda = groupedInvoices.get(selectedDate) ?? [];
  const agendaSummary = summarizeInvoices(agenda);

  function selectDate(date: Date) {
    setSelectedDate(toDateKey(date));
  }

  return (
    <Card className="gap-0 overflow-hidden py-0 roomy:h-full roomy:min-h-0">
      <CardHeader className="shrink-0 grid-cols-[auto_1fr] items-center gap-0 border-b px-4 py-3.5!">
        <CardTitle className="whitespace-nowrap">
          {view === 'upcoming' ? 'Upcoming schedule' : 'Invoice history'}
        </CardTitle>
        <CardDescription className="justify-self-end text-right">
          {monthSummary.count} {view === 'upcoming' ? 'expected' : 'recorded'} ·{' '}
          {formatCurrencyFromCents(monthSummary.totalCents)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <MonthNavigation
          month={activeMonth}
          monthLabel={monthLabel}
          startMonth={startMonth}
          endMonth={endMonth}
          onMonthChange={onMonthChange}
        />
        <SpendMap
          month={activeMonth}
          selectedDate={selectedDate}
          groupedInvoices={groupedInvoices}
          onSelectDate={selectDate}
        />
        <DayDetail
          view={view}
          selectedDate={selectedDate}
          invoices={agenda}
          summary={agendaSummary}
          isLoading={isLoading}
          isError={isError}
        />
      </CardContent>
    </Card>
  );
}

function SpendMap({
  month,
  selectedDate,
  groupedInvoices,
  onSelectDate,
}: {
  month: Date;
  selectedDate: string;
  groupedInvoices: Map<string, InvoiceItem[]>;
  onSelectDate: (date: Date) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });
  const totals = [...groupedInvoices.values()].map(
    (entries) => summarizeInvoices(entries).totalCents,
  );
  const maxTotal = Math.max(...totals, 1);

  return (
    <div className="shrink-0 border-b p-4">
      <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((date) => {
          const dateKey = toDateKey(date);
          const entries = groupedInvoices.get(dateKey) ?? [];
          const summary = summarizeInvoices(entries);
          const intensity = summary.totalCents / maxTotal;
          const isSelected = dateKey === selectedDate;

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!isSameMonth(date, month)}
              aria-label={`${format(date, 'MMMM d, yyyy')}, ${summary.count} ${summary.count === 1 ? 'invoice' : 'invoices'}, ${formatCurrencyFromCents(summary.totalCents)}`}
              aria-pressed={isSelected}
              className={cn(
                'relative aspect-square rounded-md border text-xs tabular-nums outline-none transition-[box-shadow,border-color] duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                !isSameMonth(date, month) && 'invisible',
                isSelected
                  ? 'border-primary-light ring-4 ring-primary-light/40'
                  : 'border-transparent',
                summary.count === 0 && 'bg-muted/35 text-muted-foreground',
                'hover:border-primary-light/70 hover:ring-3 hover:ring-primary-light/30',
              )}
              style={
                summary.count > 0
                  ? {
                      backgroundColor: `color-mix(in oklab, var(--primary) ${24 + intensity * 66}%, var(--card))`,
                      color:
                        intensity > 0.52
                          ? 'var(--primary-foreground)'
                          : 'var(--foreground)',
                    }
                  : undefined
              }
              onClick={() => onSelectDate(date)}
            >
              <span className="absolute top-1.5 left-1.5">
                {format(date, 'd')}
              </span>
              {summary.count > 0 ? (
                <span className="absolute right-1.5 bottom-1 text-[9px] font-bold">
                  {formatCompactCurrency(summary.totalCents)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Daily invoice spend</span>
        <span className="flex items-center gap-1.5">
          Less
          {[18, 36, 58, 82].map((opacity) => (
            <span
              key={opacity}
              className="size-2.5 rounded-sm bg-primary"
              style={{ opacity: opacity / 100 }}
            />
          ))}
          More
        </span>
      </div>
    </div>
  );
}

function MonthNavigation({
  month,
  monthLabel,
  startMonth,
  endMonth,
  onMonthChange,
}: {
  month: Date;
  monthLabel: string;
  startMonth?: Date;
  endMonth?: Date;
  onMonthChange: (month: Date) => void;
}) {
  const previousMonth = addMonths(month, -1);
  const nextMonth = addMonths(month, 1);
  const previousDisabled = startMonth
    ? previousMonth < startOfMonth(startMonth)
    : false;
  const nextDisabled = endMonth ? nextMonth > startOfMonth(endMonth) : false;

  return (
    <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={previousDisabled}
        aria-label="Previous month"
        onClick={() => onMonthChange(previousMonth)}
      >
        <ChevronLeft />
      </Button>
      <span className="text-sm font-semibold">{monthLabel}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={nextDisabled}
        aria-label="Next month"
        onClick={() => onMonthChange(nextMonth)}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

function DayDetail({
  view,
  selectedDate,
  invoices,
  summary,
  isLoading,
  isError,
}: {
  view: InvoiceView;
  selectedDate: string;
  invoices: InvoiceItem[];
  summary: { count: number; totalCents: number };
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <div className="min-h-0 roomy:flex roomy:flex-1 roomy:flex-col">
      <div className="flex shrink-0 items-baseline justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="font-medium">{formatInvoiceDate(selectedDate)}</span>
          <span
            className="text-sm text-muted-foreground"
            aria-label={`${summary.count} ${summary.count === 1 ? 'invoice' : 'invoices'}`}
          >
            ({summary.count})
          </span>
        </div>
        {summary.count > 0 ? (
          <span className="font-semibold tabular-nums">
            {formatCurrencyFromCents(summary.totalCents)}
          </span>
        ) : null}
      </div>
      <ScrollArea className="max-h-52 roomy:min-h-0 roomy:max-h-none roomy:flex-1">
        {isLoading || isError || invoices.length === 0 ? (
          <EmptyScheduleState
            compact
            message={
              isLoading
                ? 'Loading schedule...'
                : isError
                  ? 'The invoice schedule is unavailable.'
                  : `No invoices ${view === 'upcoming' ? 'expected' : 'recorded'} on this day.`
            }
          />
        ) : (
          <div className="space-y-1 p-2">
            {invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: InvoiceItem }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
      <SubscriptionIcon
        domain={invoice.iconRef}
        name={invoice.name}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{invoice.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {invoice.category}
        </div>
      </div>
      <span
        className="text-sm font-medium tabular-nums"
        aria-label={`${(invoice.amount / 100).toFixed(2)} US dollars`}
      >
        {formatCurrencyFromCents(invoice.amount)}
      </span>
    </div>
  );
}

function EmptyScheduleState({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'grid place-items-center px-6 text-center text-sm text-muted-foreground',
        compact ? 'min-h-28' : 'min-h-80',
      )}
    >
      {message}
    </div>
  );
}

function formatCompactCurrency(cents: number) {
  const dollars = cents / 100;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: dollars >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: dollars < 100 ? 0 : 1,
  }).format(dollars);
}
