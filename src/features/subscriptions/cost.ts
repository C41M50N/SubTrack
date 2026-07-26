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

/**
 * Strips anything that can't belong in a decimal amount so pasted values like
 * `$1,299.00` survive intact. Without this, `Number.parseFloat` stops at the
 * comma and silently records $1.00.
 *
 * Only filters characters, never reorders or reformats, so the caret stays put
 * while typing.
 */
export function sanitizeCostInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [whole, ...fractions] = cleaned.split('.');

  if (fractions.length === 0) {
    return whole;
  }

  // Extra dots collapse into the fraction, capped at cents precision.
  return `${whole}.${fractions.join('').slice(0, 2)}`;
}

/** Parses a decimal amount string to integer cents, or null if unusable. */
export function parseCostToCents(value: string): number | null {
  const trimmed = value.trim();

  if (trimmed === '') {
    return null;
  }

  // Number() rejects trailing garbage that Number.parseFloat would accept.
  const amount = Number(trimmed);

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  const cents = Math.round(amount * 100);

  return Number.isSafeInteger(cents) ? cents : null;
}

/** Renders stored cents for a text input, e.g. 990 -> "9.90". */
export function formatCentsForInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Blur normalization: pads to cents precision, leaves unparseable input alone. */
export function normalizeCostInput(value: string): string {
  const cents = parseCostToCents(value);

  return cents === null ? value : formatCentsForInput(cents);
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
