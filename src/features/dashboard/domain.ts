import { addMonths, format, startOfMonth } from 'date-fns';

import type { InvoiceItem, ProjectedInvoice, RecordedInvoice } from '@/features/invoices/domain';
import { toDateKey, toMonthKey } from '@/features/invoices/domain';
import { effectiveMonthlyCents, type CostInput } from '@/features/subscriptions/cost';

/** Months of recorded history shown before the current month. */
export const TREND_MONTHS_BEFORE = 6;

/** Months of projected spend shown after the current month. */
export const TREND_MONTHS_AFTER = 6;

/** Days ahead covered by the dashboard's upcoming invoice list. */
export const UPCOMING_LIST_DAYS = 14;

/** Rows shown in the recently recorded list. */
export const RECENT_LIST_LIMIT = 8;

export const UNCATEGORIZED_LABEL = 'Uncategorized';

export type SpendTrendPoint = {
  /** yyyy-MM */
  monthKey: string;
  /** Short axis label, e.g. "Mar" or "Jan ’27". */
  label: string;
  /** Full label for tooltips and the table view, e.g. "March 2026". */
  longLabel: string;
  recordedCents: number;
  projectedCents: number;
  status: 'past' | 'current' | 'future';
};

/**
 * Inclusive-start, exclusive-end date range of recorded history the trend
 * needs: the past months plus the current month to date.
 *
 * The current month is included so the same request feeds the "Recorded this
 * month" card and the recent-activity list without a second query.
 */
export function getRecordedTrendRange(now: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  const currentMonth = startOfMonth(now);

  return {
    startDate: toDateKey(addMonths(currentMonth, -TREND_MONTHS_BEFORE)),
    endDate: toDateKey(addMonths(currentMonth, 1)),
  };
}

function monthLabel(date: Date, isFirst: boolean): string {
  // January and the first bar carry a year so the axis stays anchored across
  // the year boundary the 13-month window always straddles.
  return isFirst || date.getMonth() === 0 ? format(date, 'MMM ’yy') : format(date, 'MMM');
}

/**
 * Buckets recorded and projected invoices into one bar per month around now.
 *
 * Past months only ever carry recorded spend and future months only projected
 * spend. The current month is the seam: recorded invoices to date plus
 * projections for the rest of the month. The invoice processor advances each
 * subscription's next invoice date past everything it records, so the two
 * halves never double count.
 *
 * Every month in the window is present, zero-filled, so the chart's x axis is
 * stable regardless of data.
 */
export function buildSpendTrend(
  recorded: RecordedInvoice[],
  projected: ProjectedInvoice[],
  now: Date = new Date(),
): SpendTrendPoint[] {
  const currentMonth = startOfMonth(now);
  const currentKey = toMonthKey(currentMonth);
  const points: SpendTrendPoint[] = [];
  const indexByKey = new Map<string, number>();

  for (let offset = -TREND_MONTHS_BEFORE; offset <= TREND_MONTHS_AFTER; offset += 1) {
    const date = addMonths(currentMonth, offset);
    const monthKey = toMonthKey(date);

    indexByKey.set(monthKey, points.length);
    points.push({
      monthKey,
      label: monthLabel(date, points.length === 0),
      longLabel: format(date, 'MMMM yyyy'),
      recordedCents: 0,
      projectedCents: 0,
      status: offset < 0 ? 'past' : offset === 0 ? 'current' : 'future',
    });
  }

  for (const invoice of recorded) {
    const index = indexByKey.get(invoice.date.slice(0, 7));

    if (index !== undefined) {
      points[index].recordedCents += invoice.amount;
    }
  }

  for (const invoice of projected) {
    const monthKey = invoice.date.slice(0, 7);
    const index = indexByKey.get(monthKey);

    // Projections before the current month are stale schedules, not history;
    // the past is owned by recorded invoices alone.
    if (index !== undefined && monthKey >= currentKey) {
      points[index].projectedCents += invoice.amount;
    }
  }

  return points;
}

export type CategoryBreakdownInput = CostInput & {
  category: string | null;
};

export type CategoryShare = {
  category: string;
  /** Effective monthly cost of the category's subscriptions, in cents. */
  monthlyCents: number;
  /** Number of subscriptions in the category. */
  count: number;
  /** Fraction of the collection's total effective monthly cost, 0..1. */
  share: number;
};

/**
 * Groups subscriptions by category and ranks them by effective monthly cost.
 *
 * Uses the smoothed monthly figure rather than projected cash so the ranking
 * does not lurch when an annual plan happens to renew this month.
 */
export function buildCategoryBreakdown(subscriptions: CategoryBreakdownInput[]): CategoryShare[] {
  const byCategory = new Map<string, { monthlyCents: number; count: number }>();
  let totalCents = 0;

  for (const subscription of subscriptions) {
    const category = subscription.category ?? UNCATEGORIZED_LABEL;
    const monthlyCents = effectiveMonthlyCents(subscription);
    const entry = byCategory.get(category) ?? { monthlyCents: 0, count: 0 };

    entry.monthlyCents += monthlyCents;
    entry.count += 1;
    totalCents += monthlyCents;
    byCategory.set(category, entry);
  }

  return [...byCategory.entries()]
    .map(([category, entry]) => ({
      category,
      monthlyCents: entry.monthlyCents,
      count: entry.count,
      share: totalCents > 0 ? entry.monthlyCents / totalCents : 0,
    }))
    .sort((a, b) => b.monthlyCents - a.monthlyCents || a.category.localeCompare(b.category));
}

/** Distinct named categories in use, ignoring Uncategorized. */
export function countCategories(subscriptions: { category: string | null }[]): number {
  return new Set(subscriptions.flatMap((subscription) => (subscription.category ? [subscription.category] : []))).size;
}

/** Recorded invoices with a date in the same calendar month as `now`. */
export function invoicesInCurrentMonth<T extends InvoiceItem>(invoices: T[], now: Date = new Date()): T[] {
  const monthKey = toMonthKey(now);

  return invoices.filter((invoice) => invoice.date.startsWith(monthKey));
}
