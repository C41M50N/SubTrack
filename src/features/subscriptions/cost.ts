import { addMonths, addWeeks, addYears, format, isBefore, parseISO, startOfMonth } from 'date-fns';

import type { SubscriptionCostFrequency } from '@/features/subscriptions/server';

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

export type CostInput = {
  costAmount: number; // in cents
  costFrequency: SubscriptionCostFrequency;
  nextInvoiceDate: string; // ISO date (yyyy-MM-dd)
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatCurrencyFromCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

const frequencyLabels: Record<SubscriptionCostFrequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  biennially: 'Every 2 years',
};

const frequencyUnits: Record<SubscriptionCostFrequency, string> = {
  weekly: '/wk',
  monthly: '/mo',
  yearly: '/yr',
  biennially: '/2yr',
};

export function formatFrequency(frequency: SubscriptionCostFrequency): string {
  return frequencyLabels[frequency];
}

export function frequencyUnit(frequency: SubscriptionCostFrequency): string {
  return frequencyUnits[frequency];
}

/**
 * Normalizes any billing cadence to an average monthly cost in cents.
 * Weekly is annualized first so months with a partial week are averaged out.
 */
export function effectiveMonthlyCents(input: CostInput): number {
  switch (input.costFrequency) {
    case 'weekly':
      return (input.costAmount * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
    case 'monthly':
      return input.costAmount;
    case 'yearly':
      return input.costAmount / MONTHS_PER_YEAR;
    case 'biennially':
      return input.costAmount / (MONTHS_PER_YEAR * 2);
  }
}

/** Normalizes any billing cadence to an average yearly cost in cents. */
export function effectiveYearlyCents(input: CostInput): number {
  switch (input.costFrequency) {
    case 'weekly':
      return input.costAmount * WEEKS_PER_YEAR;
    case 'monthly':
      return input.costAmount * MONTHS_PER_YEAR;
    case 'yearly':
      return input.costAmount;
    case 'biennially':
      return input.costAmount / 2;
  }
}

export function sumEffectiveMonthlyCents(items: CostInput[]): number {
  return items.reduce((total, item) => total + effectiveMonthlyCents(item), 0);
}

export function sumEffectiveYearlyCents(items: CostInput[]): number {
  return items.reduce((total, item) => total + effectiveYearlyCents(item), 0);
}

function advance(date: Date, frequency: SubscriptionCostFrequency): Date {
  switch (frequency) {
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    case 'yearly':
      return addYears(date, 1);
    case 'biennially':
      return addYears(date, 2);
  }
}

export type MonthlyBreakdownEntry = {
  monthKey: string; // yyyy-MM
  label: string; // e.g. "Jan 2026"
  date: Date; // start of month
  totalCents: number;
};

/**
 * Projects each subscription's actual invoices across the next `months` and
 * buckets the billed amount into the month it falls in. Unlike the smoothed
 * effective cost, this reflects real cash flow: a biennial plan may bill $0 in
 * most months, while a weekly plan can bill several times in one month.
 */
export function buildMonthlyBreakdown(
  items: CostInput[],
  from: Date = new Date(),
  months = 12,
): MonthlyBreakdownEntry[] {
  const windowStart = startOfMonth(from);
  const windowEndExclusive = addMonths(windowStart, months);

  const entries: MonthlyBreakdownEntry[] = [];
  const indexByKey = new Map<string, number>();

  for (let index = 0; index < months; index += 1) {
    const date = addMonths(windowStart, index);
    const monthKey = format(date, 'yyyy-MM');

    indexByKey.set(monthKey, index);
    entries.push({
      monthKey,
      label: format(date, 'MMM yyyy'),
      date,
      totalCents: 0,
    });
  }

  for (const item of items) {
    let occurrence = parseISO(item.nextInvoiceDate);

    // Overdue or historical invoices roll forward to the first occurrence that
    // lands inside (or after) the window.
    while (isBefore(occurrence, windowStart)) {
      occurrence = advance(occurrence, item.costFrequency);
    }

    while (isBefore(occurrence, windowEndExclusive)) {
      const index = indexByKey.get(format(occurrence, 'yyyy-MM'));

      if (index !== undefined) {
        entries[index].totalCents += item.costAmount;
      }

      occurrence = advance(occurrence, item.costFrequency);
    }
  }

  return entries;
}
