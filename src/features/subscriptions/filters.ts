import type { Dayjs } from 'dayjs';
import dayjs from '@/lib/dayjs';
import { stepInvoiceDate } from './billing';
import type { SubscriptionFrequency } from './constants';

type ScheduledSubscription = {
  next_invoice: Date;
  frequency: SubscriptionFrequency;
};

export function getNextNMonths(count: number): Dayjs[] {
  const months: Dayjs[] = [];
  for (let offset = 0; offset < count; offset++) {
    months.push(dayjs().add(1 + offset, 'month'));
  }
  return months;
}

export function getSubscriptionsInMonth<T extends ScheduledSubscription>(
  subscriptions: T[],
  month: number,
  year: number
): T[] {
  const start = dayjs().set('month', month).set('year', year).startOf('month');
  const end = start.endOf('month');

  return subscriptions.filter((subscription) =>
    subscriptionRenewsInPeriod(subscription, start, end)
  );
}

function subscriptionRenewsInPeriod(
  subscription: ScheduledSubscription,
  start: Dayjs,
  end: Dayjs
): boolean {
  let invoiceDate = dayjs(subscription.next_invoice);
  while (!invoiceDate.isBefore(start)) {
    invoiceDate = stepInvoiceDate('bwd', invoiceDate, subscription.frequency);
  }

  let current = invoiceDate;
  while (current.isBefore(end)) {
    if (current.isSame(start, 'month') && current.isSame(start, 'year')) {
      return true;
    }
    current = stepInvoiceDate('fwd', current, subscription.frequency);
  }

  return false;
}
