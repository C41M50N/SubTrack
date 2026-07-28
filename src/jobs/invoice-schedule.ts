import { addMonths, addWeeks, addYears, format, parseISO } from 'date-fns';

import type { SubscriptionCostFrequency } from '@/features/subscriptions/server';

function advanceInvoiceDate(date: string, frequency: SubscriptionCostFrequency): string {
  const parsedDate = parseISO(date);

  switch (frequency) {
    case 'weekly':
      return format(addWeeks(parsedDate, 1), 'yyyy-MM-dd');
    case 'monthly':
      return format(addMonths(parsedDate, 1), 'yyyy-MM-dd');
    case 'yearly':
      return format(addYears(parsedDate, 1), 'yyyy-MM-dd');
    case 'biennially':
      return format(addYears(parsedDate, 2), 'yyyy-MM-dd');
  }
}

export function buildDueInvoiceSchedule(
  nextInvoiceDate: string,
  frequency: SubscriptionCostFrequency,
  processingDate: string,
): { invoiceDates: string[]; nextInvoiceDate: string } {
  const invoiceDates: string[] = [];
  let scheduledDate = nextInvoiceDate;

  while (scheduledDate <= processingDate) {
    invoiceDates.push(scheduledDate);
    scheduledDate = advanceInvoiceDate(scheduledDate, frequency);
  }

  return { invoiceDates, nextInvoiceDate: scheduledDate };
}
