import { advanceInvoiceDate } from '@/features/invoices/domain';
import type { SubscriptionCostFrequency } from '@/features/subscriptions/server';

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
