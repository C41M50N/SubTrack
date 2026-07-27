import { differenceInCalendarDays, differenceInCalendarMonths, format, parseISO, startOfDay } from 'date-fns';

/** Beyond this many days, distances read in months rather than days. */
const DAY_PRECISION_LIMIT = 60;

/** Formats an ISO date string (yyyy-MM-dd) as e.g. "Jan 15, 2026". */
export function formatInvoiceDate(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM d, yyyy');
}

function pluralize(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

/**
 * Describes an invoice date relative to `now`, e.g. "in 3 days" or "2 months ago".
 *
 * Distances are measured in calendar days rather than elapsed time, because
 * `nextInvoiceDate` is a date-only value with no meaningful time component.
 */
export function formatInvoiceDistance(isoDate: string, now: Date = new Date()): string {
  const target = startOfDay(parseISO(isoDate));
  const today = startOfDay(now);
  const days = differenceInCalendarDays(target, today);

  if (days === 0) {
    return 'Today';
  }

  if (days === 1) {
    return 'Tomorrow';
  }

  if (days === -1) {
    return 'Yesterday';
  }

  if (Math.abs(days) <= DAY_PRECISION_LIMIT) {
    return days > 0 ? `in ${pluralize(days, 'day')}` : `${pluralize(-days, 'day')} ago`;
  }

  const months = differenceInCalendarMonths(target, today);

  return months > 0 ? `in ${pluralize(months, 'month')}` : `${pluralize(-months, 'month')} ago`;
}
