import { format, parseISO } from 'date-fns';

/** Formats an ISO date string (yyyy-MM-dd) as e.g. "Jan 15, 2026". */
export function formatInvoiceDate(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM d, yyyy');
}
