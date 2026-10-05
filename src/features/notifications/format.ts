import { formatCurrencyFromCents } from '@/features/subscriptions/cost';

// Display helpers shared by the email, Discord, and settings formats. Date keys
// are formatted from their UTC fields so the server's time zone can't shift them.

export const BRAND_COLOR = '#0069a8';

export const formatUsd = formatCurrencyFromCents;

function dateKeyToUtc(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day ?? 1));
}

const shortDateFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
const weekdayDateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});
const longDateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const monthFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' });
const monthNameFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long' });

/** "Oct 7" */
export function formatShortDate(dateKey: string): string {
  return shortDateFormat.format(dateKeyToUtc(dateKey));
}

/** "Tue, Oct 7" */
export function formatWeekdayDate(dateKey: string): string {
  return weekdayDateFormat.format(dateKeyToUtc(dateKey));
}

/** "Tuesday, October 7, 2026" */
export function formatLongDate(dateKey: string): string {
  return longDateFormat.format(dateKeyToUtc(dateKey));
}

/** "October 2026" for a yyyy-MM month key. */
export function formatMonth(monthKey: string): string {
  return monthFormat.format(dateKeyToUtc(`${monthKey}-01`));
}

/** "October" for a yyyy-MM month key. */
export function formatMonthName(monthKey: string): string {
  return monthNameFormat.format(dateKeyToUtc(`${monthKey}-01`));
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
