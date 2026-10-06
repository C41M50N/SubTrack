import { addDays, addMonths, addWeeks, addYears, format, parseISO, startOfDay, startOfMonth } from 'date-fns';

import type { SubscriptionCostFrequency } from '@/features/subscriptions/server';

export type InvoiceView = 'upcoming' | 'history';

export type ProjectionInput = {
  id: string;
  name: string;
  iconRef: string;
  category: string | null;
  costAmount: number;
  costFrequency: SubscriptionCostFrequency;
  nextInvoiceDate: string;
};

export type ProjectedInvoice = {
  kind: 'upcoming';
  id: string;
  subscriptionId: string;
  name: string;
  iconRef: string;
  category: string;
  amount: number;
  frequency: SubscriptionCostFrequency;
  date: string;
};

export type RecordedInvoice = {
  kind: 'recorded';
  id: string;
  subscriptionId: string | null;
  name: string;
  iconRef: string;
  category: string;
  amount: number;
  date: string;
};

export type InvoiceItem = ProjectedInvoice | RecordedInvoice;

export type RecordedInvoiceInput = {
  id: string;
  subscriptionId: string | null;
  name: string;
  iconRef: string;
  category: string;
  amount: number;
  invoiceDate: string;
};

export type InvoiceSummary = {
  count: number;
  totalCents: number;
};

export const INVOICE_PROJECTION_MONTHS = 12;

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function toMonthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function getMonthRange(month: string): {
  startDate: string;
  endDate: string;
} {
  const start = parseISO(`${month}-01`);

  return {
    startDate: toDateKey(start),
    endDate: toDateKey(addMonths(start, 1)),
  };
}

export function getCurrentMonthRange(now: Date = new Date()) {
  return getMonthRange(toMonthKey(now));
}

export function getProjectionRange(now: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  return {
    startDate: toDateKey(startOfDay(now)),
    endDate: toDateKey(addMonths(startOfMonth(now), INVOICE_PROJECTION_MONTHS)),
  };
}

export function getProjectionMonthBounds(now: Date = new Date()): {
  firstMonth: Date;
  lastMonth: Date;
} {
  const firstMonth = startOfMonth(now);

  return {
    firstMonth,
    lastMonth: addMonths(firstMonth, INVOICE_PROJECTION_MONTHS - 1),
  };
}

export function advanceInvoiceDate(date: string, frequency: SubscriptionCostFrequency): string {
  const parsedDate = parseISO(date);

  switch (frequency) {
    case 'weekly':
      return toDateKey(addWeeks(parsedDate, 1));
    case 'monthly':
      return toDateKey(addMonths(parsedDate, 1));
    case 'yearly':
      return toDateKey(addYears(parsedDate, 1));
    case 'biennially':
      return toDateKey(addYears(parsedDate, 2));
  }
}

export function compareProjectedInvoices(a: ProjectedInvoice, b: ProjectedInvoice): number {
  return (
    a.date.localeCompare(b.date) || b.amount - a.amount || a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
  );
}

export function compareRecordedInvoices(a: RecordedInvoice, b: RecordedInvoice): number {
  return (
    b.date.localeCompare(a.date) || b.amount - a.amount || a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
  );
}

export function projectInvoices(
  subscriptions: ProjectionInput[],
  range: { startDate: string; endDate: string },
): ProjectedInvoice[] {
  const invoices: ProjectedInvoice[] = [];

  for (const subscription of subscriptions) {
    let date = subscription.nextInvoiceDate;

    while (date < range.startDate) {
      date = advanceInvoiceDate(date, subscription.costFrequency);
    }

    while (date < range.endDate) {
      invoices.push({
        kind: 'upcoming',
        id: `${subscription.id}:${date}`,
        subscriptionId: subscription.id,
        name: subscription.name,
        iconRef: subscription.iconRef,
        category: subscription.category ?? 'Uncategorized',
        amount: subscription.costAmount,
        frequency: subscription.costFrequency,
        date,
      });
      date = advanceInvoiceDate(date, subscription.costFrequency);
    }
  }

  return invoices.sort(compareProjectedInvoices);
}

export function toRecordedInvoices(records: RecordedInvoiceInput[]): RecordedInvoice[] {
  return records
    .map((record) => ({
      kind: 'recorded' as const,
      id: record.id,
      subscriptionId: record.subscriptionId,
      name: record.name,
      iconRef: record.iconRef,
      category: record.category,
      amount: record.amount,
      date: record.invoiceDate,
    }))
    .sort(compareRecordedInvoices);
}

export function summarizeInvoices(invoices: InvoiceItem[]): InvoiceSummary {
  return invoices.reduce(
    (summary, invoice) => ({
      count: summary.count + 1,
      totalCents: summary.totalCents + invoice.amount,
    }),
    { count: 0, totalCents: 0 },
  );
}

export function invoicesInMonth(invoices: InvoiceItem[], month: string): InvoiceItem[] {
  return invoices.filter((invoice) => invoice.date.startsWith(month));
}

export function invoicesInRollingWindow(
  invoices: ProjectedInvoice[],
  now: Date = new Date(),
  days = 30,
): ProjectedInvoice[] {
  const startDate = toDateKey(startOfDay(now));
  const endDate = toDateKey(addDays(startOfDay(now), days));

  return invoices.filter((invoice) => invoice.date >= startDate && invoice.date < endDate);
}

export function groupInvoicesByDate(invoices: InvoiceItem[]): Map<string, InvoiceItem[]> {
  const grouped = new Map<string, InvoiceItem[]>();

  for (const invoice of invoices) {
    const entries = grouped.get(invoice.date) ?? [];
    entries.push(invoice);
    grouped.set(invoice.date, entries);
  }

  return grouped;
}

export function getDefaultSelectedDate(month: string, invoices: InvoiceItem[], now: Date = new Date()): string {
  const today = toDateKey(now);

  if (month === toMonthKey(now)) {
    return today;
  }

  const earliestDate = invoices.reduce<string | null>((earliest, invoice) => {
    if (!invoice.date.startsWith(month)) {
      return earliest;
    }

    return !earliest || invoice.date < earliest ? invoice.date : earliest;
  }, null);

  return earliestDate ?? `${month}-01`;
}
