import { advanceInvoiceDate } from '@/features/invoices/domain';
import type {
  NewMonthItem,
  ProjectedInvoiceItem,
  RecordedInvoiceItem,
  ReminderItem,
} from '@/features/notifications/content';
import { addDaysToDateKey, getSendTime, toLocalDateKey, type OverviewPeriod } from '@/features/notifications/time';
import type { SubscriptionCostFrequency, SubscriptionStatus } from '@/features/subscriptions/server';

export type ReminderSubscription = {
  id: string;
  collectionId: string;
  name: string;
  iconRef: string;
  status: SubscriptionStatus;
  notificationsIncluded: boolean;
  costAmount: number;
  costFrequency: SubscriptionCostFrequency;
  nextInvoiceDate: string;
  remindersEligibleAt: Date;
};

export type ReminderRoute = {
  collectionId: string;
  /** When the collection started routing reminders to the destination. */
  createdAt: Date;
};

export type ReminderTiming = {
  timeZone: string;
  leadDays: number;
  timingChangedAt: Date;
};

export type ReminderOccurrence = ReminderItem & {
  /** The normal reminder date: the invoice date minus the lead time. */
  reminderDate: string;
};

function laterOf(a: Date, b: Date): Date {
  return a > b ? a : b;
}

/** Occurrences of a schedule after `afterDate`, through `throughDate` inclusive. */
export function listOccurrencesBetween(
  schedule: { nextInvoiceDate: string; costFrequency: SubscriptionCostFrequency },
  afterDate: string,
  throughDate: string,
): string[] {
  const dates: string[] = [];
  let date = schedule.nextInvoiceDate;

  while (date <= afterDate) {
    date = advanceInvoiceDate(date, schedule.costFrequency);
  }

  while (date <= throughDate) {
    dates.push(date);
    date = advanceInvoiceDate(date, schedule.costFrequency);
  }

  return dates;
}

/**
 * Subscription occurrences a destination should be reminded about in the
 * reminder sent for `slotDate`.
 *
 * An occurrence qualifies when its normal reminder date is on or before the
 * slot and its invoice date is still in the future at `now`. That second rule
 * lets a reminder missed during an outage go out late, but never on or after
 * the charge.
 *
 * A reminder whose 9 a.m. send time had already passed when the subscription
 * was created, rescheduled, included, or moved, when the route was turned on,
 * or when the user changed their timing, is never caught up. Those changes
 * only affect future reminders.
 *
 * Occurrences already reminded about are filtered out separately, through the
 * destination's reminder claims.
 */
export function listDueReminderOccurrences(input: {
  subscriptions: ReminderSubscription[];
  routes: ReminderRoute[];
  timing: ReminderTiming;
  slotDate: string;
  now: Date;
}): ReminderOccurrence[] {
  const { timing } = input;
  const today = toLocalDateKey(input.now, timing.timeZone);
  const lastInvoiceDate = addDaysToDateKey(input.slotDate, timing.leadDays);
  const routeCreatedAt = new Map(input.routes.map((route) => [route.collectionId, route.createdAt]));
  const occurrences: ReminderOccurrence[] = [];

  for (const subscription of input.subscriptions) {
    const routedAt = routeCreatedAt.get(subscription.collectionId);

    if (subscription.status !== 'active' || !subscription.notificationsIncluded || !routedAt) {
      continue;
    }

    const eligibleFrom = laterOf(laterOf(subscription.remindersEligibleAt, routedAt), timing.timingChangedAt);

    for (const invoiceDate of listOccurrencesBetween(subscription, today, lastInvoiceDate)) {
      const reminderDate = addDaysToDateKey(invoiceDate, -timing.leadDays);
      const reminderAt = getSendTime(reminderDate, timing.timeZone);

      if (reminderAt < eligibleFrom || reminderAt > input.now) {
        continue;
      }

      occurrences.push({
        subscriptionId: subscription.id,
        collectionId: subscription.collectionId,
        name: subscription.name,
        iconRef: subscription.iconRef,
        expectedDate: invoiceDate,
        amountCents: subscription.costAmount,
        reminderDate,
      });
    }
  }

  return occurrences;
}

export type OverviewInvoice = {
  id: string;
  subscriptionId: string | null;
  collectionId: string;
  name: string;
  iconRef: string;
  category: string;
  amount: number;
  invoiceDate: string;
  notificationsIncluded: boolean;
};

export type OverviewSubscription = {
  id: string;
  collectionId: string;
  name: string;
  iconRef: string;
  category: string | null;
  status: SubscriptionStatus;
  notificationsIncluded: boolean;
  costAmount: number;
  costFrequency: SubscriptionCostFrequency;
  nextInvoiceDate: string;
};

function toRecordedItem(invoice: OverviewInvoice): RecordedInvoiceItem {
  return {
    source: 'recorded',
    invoiceId: invoice.id,
    subscriptionId: invoice.subscriptionId,
    collectionId: invoice.collectionId,
    name: invoice.name,
    iconRef: invoice.iconRef,
    category: invoice.category,
    date: invoice.invoiceDate,
    amountCents: invoice.amount,
  };
}

/**
 * The items in one destination's monthly overview.
 *
 * The previous month comes only from recorded invoice snapshots, attributed to
 * the collection recorded on each. The new month starts with invoices already
 * recorded in it, then projects the rest of each active subscription's current
 * schedule through the month's end. An occurrence already recorded is never
 * projected again, even if its subscription has since moved.
 *
 * `collectionIds` are the collections routed to the destination. `invoices`
 * may include any of the user's invoices from both months.
 */
export function buildOverviewItems(input: {
  period: OverviewPeriod;
  collectionIds: ReadonlySet<string>;
  invoices: OverviewInvoice[];
  subscriptions: OverviewSubscription[];
}): { previousItems: RecordedInvoiceItem[]; newMonthItems: NewMonthItem[] } {
  const { period } = input;
  const isListed = (invoice: OverviewInvoice) =>
    invoice.notificationsIncluded && input.collectionIds.has(invoice.collectionId);

  const previousItems = input.invoices
    .filter(
      (invoice) =>
        invoice.invoiceDate >= period.previousStartDate &&
        invoice.invoiceDate < period.previousEndDate &&
        isListed(invoice),
    )
    .map(toRecordedItem);

  const newMonthInvoices = input.invoices.filter(
    (invoice) => invoice.invoiceDate >= period.startDate && invoice.invoiceDate < period.endDate,
  );
  const recordedOccurrences = new Set(
    newMonthInvoices.flatMap((invoice) =>
      invoice.subscriptionId ? [`${invoice.subscriptionId}:${invoice.invoiceDate}`] : [],
    ),
  );

  const projectedItems: ProjectedInvoiceItem[] = [];

  for (const subscription of input.subscriptions) {
    if (
      subscription.status !== 'active' ||
      !subscription.notificationsIncluded ||
      !input.collectionIds.has(subscription.collectionId)
    ) {
      continue;
    }

    const dates = listOccurrencesBetween(
      subscription,
      addDaysToDateKey(period.startDate, -1),
      addDaysToDateKey(period.endDate, -1),
    );

    for (const date of dates) {
      if (recordedOccurrences.has(`${subscription.id}:${date}`)) {
        continue;
      }

      projectedItems.push({
        source: 'projected',
        subscriptionId: subscription.id,
        collectionId: subscription.collectionId,
        name: subscription.name,
        iconRef: subscription.iconRef,
        category: subscription.category ?? 'Uncategorized',
        date,
        amountCents: subscription.costAmount,
      });
    }
  }

  return {
    previousItems,
    newMonthItems: [...newMonthInvoices.filter(isListed).map(toRecordedItem), ...projectedItems],
  };
}
