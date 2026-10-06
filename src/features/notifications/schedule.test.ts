import { describe, expect, it } from 'vitest';

import {
  buildOverviewItems,
  listDueReminderOccurrences,
  listOccurrencesBetween,
  type OverviewInvoice,
  type OverviewSubscription,
  type ReminderSubscription,
} from '@/features/notifications/schedule';
import { getDueReminderSlot, getOverviewPeriod } from '@/features/notifications/time';

const TIME_ZONE = 'America/New_York';
const LONG_AGO = new Date('2026-01-01T00:00:00Z');
const utc = (iso: string) => new Date(iso);

function subscription(overrides: Partial<ReminderSubscription> = {}): ReminderSubscription {
  return {
    id: 'sub-1',
    collectionId: 'personal',
    name: 'Streamline Video',
    iconRef: 'example.com',
    status: 'active',
    notificationsIncluded: true,
    costAmount: 1599,
    costFrequency: 'monthly',
    nextInvoiceDate: '2026-10-07',
    remindersEligibleAt: LONG_AGO,
    ...overrides,
  };
}

function remind(input: {
  now: Date;
  subscriptions?: ReminderSubscription[];
  leadDays?: number;
  routedAt?: Date;
  timingChangedAt?: Date;
  routes?: { collectionId: string; createdAt: Date }[];
}) {
  return listDueReminderOccurrences({
    subscriptions: input.subscriptions ?? [subscription()],
    routes: input.routes ?? [{ collectionId: 'personal', createdAt: input.routedAt ?? LONG_AGO }],
    timing: { timeZone: TIME_ZONE, leadDays: input.leadDays ?? 3, timingChangedAt: input.timingChangedAt ?? LONG_AGO },
    slotDate: getDueReminderSlot(input.now, TIME_ZONE).date,
    now: input.now,
  });
}

const dates = (occurrences: { expectedDate: string }[]) => occurrences.map((occurrence) => occurrence.expectedDate);

describe('listDueReminderOccurrences', () => {
  describe('lead time', () => {
    it('reminds at 9 a.m. local, lead days before the charge', () => {
      // October 7 minus 3 days is October 4; 9 a.m. EDT is 13:00 UTC.
      expect(remind({ now: utc('2026-10-04T12:59:00Z') })).toEqual([]);
      expect(remind({ now: utc('2026-10-04T13:00:00Z') })).toEqual([
        {
          subscriptionId: 'sub-1',
          collectionId: 'personal',
          name: 'Streamline Video',
          iconRef: 'example.com',
          expectedDate: '2026-10-07',
          amountCents: 1599,
          reminderDate: '2026-10-04',
        },
      ]);
    });

    it.each([1, 6])('supports a %i-day lead', (leadDays) => {
      const reminderDay = leadDays === 1 ? '2026-10-06' : '2026-10-01';

      expect(remind({ leadDays, now: utc(`${reminderDay}T12:59:00Z`) })).toEqual([]);
      expect(dates(remind({ leadDays, now: utc(`${reminderDay}T13:00:00Z`) }))).toEqual(['2026-10-07']);
    });

    it('doesn’t remind before the lead window opens', () => {
      expect(remind({ now: utc('2026-10-03T20:00:00Z') })).toEqual([]);
    });
  });

  describe('never on or after the charge', () => {
    it('catches up after an outage while the charge is still ahead', () => {
      // The October 4 send was missed; the service is back on October 6.
      expect(dates(remind({ now: utc('2026-10-06T15:00:00Z') }))).toEqual(['2026-10-07']);
    });

    it('drops the reminder once the invoice date arrives', () => {
      expect(remind({ now: utc('2026-10-07T13:00:00Z') })).toEqual([]);
      // Before 9 a.m. on the charge date, yesterday's send is still due, but the charge is today.
      expect(remind({ now: utc('2026-10-07T05:00:00Z') })).toEqual([]);
    });
  });

  describe('no catch-up for late changes', () => {
    it('skips a subscription created after its reminder time', () => {
      const created = subscription({ remindersEligibleAt: utc('2026-10-04T14:00:00Z') });

      expect(remind({ subscriptions: [created], now: utc('2026-10-04T14:05:00Z') })).toEqual([]);
      expect(remind({ subscriptions: [created], now: utc('2026-10-05T14:00:00Z') })).toEqual([]);
    });

    it('reminds a subscription created before its reminder time', () => {
      const created = subscription({ remindersEligibleAt: utc('2026-10-04T12:00:00Z') });

      expect(dates(remind({ subscriptions: [created], now: utc('2026-10-04T13:00:00Z') }))).toEqual(['2026-10-07']);
    });

    it('reminds on a changed date whose reminder time is still ahead', () => {
      // Rescheduled on October 4 from October 7 to October 10.
      const rescheduled = subscription({
        nextInvoiceDate: '2026-10-10',
        remindersEligibleAt: utc('2026-10-04T15:00:00Z'),
      });

      expect(remind({ subscriptions: [rescheduled], now: utc('2026-10-04T15:05:00Z') })).toEqual([]);
      expect(dates(remind({ subscriptions: [rescheduled], now: utc('2026-10-07T13:00:00Z') }))).toEqual(['2026-10-10']);
    });

    it('skips occurrences whose reminder time passed before the route was turned on', () => {
      expect(remind({ routedAt: utc('2026-10-04T13:30:00Z'), now: utc('2026-10-04T13:35:00Z') })).toEqual([]);
      expect(dates(remind({ routedAt: utc('2026-10-04T12:30:00Z'), now: utc('2026-10-04T13:35:00Z') }))).toEqual([
        '2026-10-07',
      ]);
    });

    it('skips reminder times that passed before the timing changed', () => {
      // The lead time grew to 5 days on October 3, moving the reminder to October 2.
      expect(
        remind({ leadDays: 5, timingChangedAt: utc('2026-10-03T12:00:00Z'), now: utc('2026-10-03T13:00:00Z') }),
      ).toEqual([]);
    });
  });

  describe('eligibility', () => {
    it('skips inactive, excluded, and unrouted subscriptions', () => {
      const now = utc('2026-10-04T13:00:00Z');

      expect(remind({ now, subscriptions: [subscription({ status: 'inactive' })] })).toEqual([]);
      expect(remind({ now, subscriptions: [subscription({ notificationsIncluded: false })] })).toEqual([]);
      expect(remind({ now, subscriptions: [subscription({ collectionId: 'work' })] })).toEqual([]);
    });

    it('uses the current schedule and amount', () => {
      const [occurrence] = remind({
        now: utc('2026-10-04T13:00:00Z'),
        subscriptions: [subscription({ name: 'Renamed', costAmount: 2099 })],
      });

      expect(occurrence).toMatchObject({ name: 'Renamed', amountCents: 2099 });
    });
  });

  describe('weekly recurrence', () => {
    const weekly = subscription({ costFrequency: 'weekly', nextInvoiceDate: '2026-10-07' });

    it('reminds about each weekly occurrence on its own date', () => {
      expect(dates(remind({ subscriptions: [weekly], now: utc('2026-10-04T13:00:00Z') }))).toEqual(['2026-10-07']);
      expect(remind({ subscriptions: [weekly], now: utc('2026-10-10T12:00:00Z') })).toEqual([]);
      expect(dates(remind({ subscriptions: [weekly], now: utc('2026-10-11T13:00:00Z') }))).toEqual(['2026-10-14']);
    });

    it('projects past a stale next invoice date', () => {
      const stale = subscription({ costFrequency: 'weekly', nextInvoiceDate: '2026-09-30' });

      expect(dates(remind({ subscriptions: [stale], now: utc('2026-10-04T13:00:00Z') }))).toEqual(['2026-10-07']);
    });
  });

  describe('daylight saving', () => {
    it('sends at 9 a.m. local on the day clocks spring forward', () => {
      const march = subscription({ nextInvoiceDate: '2026-03-11' });

      expect(remind({ subscriptions: [march], now: utc('2026-03-08T12:59:00Z') })).toEqual([]);
      expect(dates(remind({ subscriptions: [march], now: utc('2026-03-08T13:00:00Z') }))).toEqual(['2026-03-11']);
    });

    it('sends at 9 a.m. local on the day clocks fall back', () => {
      const november = subscription({ nextInvoiceDate: '2026-11-04' });

      expect(remind({ subscriptions: [november], now: utc('2026-11-01T13:30:00Z') })).toEqual([]);
      expect(dates(remind({ subscriptions: [november], now: utc('2026-11-01T14:00:00Z') }))).toEqual(['2026-11-04']);
    });
  });
});

describe('listOccurrencesBetween', () => {
  it('uses calendar month arithmetic at the end of a month', () => {
    expect(
      listOccurrencesBetween({ nextInvoiceDate: '2026-01-31', costFrequency: 'monthly' }, '2026-01-31', '2026-04-30'),
    ).toEqual(['2026-02-28', '2026-03-28', '2026-04-28']);
  });
});

describe('buildOverviewItems', () => {
  const period = getOverviewPeriod('2026-10', TIME_ZONE);

  function invoice(overrides: Partial<OverviewInvoice>): OverviewInvoice {
    return {
      id: 'inv-1',
      subscriptionId: 'sub-1',
      collectionId: 'personal',
      name: 'Streamline Video',
      iconRef: 'example.com',
      category: 'Streaming',
      amount: 1599,
      invoiceDate: '2026-09-07',
      notificationsIncluded: true,
      ...overrides,
    };
  }

  function overviewSubscription(overrides: Partial<OverviewSubscription>): OverviewSubscription {
    return {
      id: 'sub-1',
      collectionId: 'personal',
      name: 'Streamline Video',
      iconRef: 'example.com',
      category: 'Streaming',
      status: 'active',
      notificationsIncluded: true,
      costAmount: 1599,
      costFrequency: 'monthly',
      nextInvoiceDate: '2026-10-07',
      ...overrides,
    };
  }

  function build(input: {
    invoices?: OverviewInvoice[];
    subscriptions?: OverviewSubscription[];
    collections?: string[];
  }) {
    return buildOverviewItems({
      period,
      collectionIds: new Set(input.collections ?? ['personal']),
      invoices: input.invoices ?? [],
      subscriptions: input.subscriptions ?? [],
    });
  }

  it('builds the previous month only from recorded invoices', () => {
    const { previousItems } = build({
      invoices: [
        invoice({ id: 'aug', invoiceDate: '2026-08-31' }),
        invoice({ id: 'sep-1', invoiceDate: '2026-09-01' }),
        invoice({ id: 'sep-30', invoiceDate: '2026-09-30' }),
        invoice({ id: 'oct-1', invoiceDate: '2026-10-01' }),
      ],
      // The current schedule never reconstructs the previous month.
      subscriptions: [overviewSubscription({ costFrequency: 'weekly', nextInvoiceDate: '2026-09-02' })],
    });

    expect(previousItems.map((item) => item.invoiceId)).toEqual(['sep-1', 'sep-30']);
  });

  it('renders snapshots of deactivated and deleted subscriptions', () => {
    const { previousItems } = build({
      invoices: [
        invoice({ id: 'deactivated', subscriptionId: 'sub-inactive', name: 'Old name' }),
        invoice({ id: 'deleted', subscriptionId: null, name: 'Deleted service' }),
      ],
      subscriptions: [overviewSubscription({ id: 'sub-inactive', status: 'inactive', name: 'New name' })],
    });

    expect(previousItems).toEqual([
      expect.objectContaining({ invoiceId: 'deactivated', name: 'Old name', subscriptionId: 'sub-inactive' }),
      expect.objectContaining({ invoiceId: 'deleted', name: 'Deleted service', subscriptionId: null }),
    ]);
  });

  it('respects each invoice’s inclusion, including a deleted subscription’s final choice', () => {
    const { previousItems, newMonthItems } = build({
      invoices: [
        invoice({ id: 'excluded', notificationsIncluded: false }),
        invoice({ id: 'deleted-excluded', subscriptionId: null, notificationsIncluded: false }),
        invoice({ id: 'deleted-included', subscriptionId: null }),
        invoice({ id: 'recorded-excluded', invoiceDate: '2026-10-01', notificationsIncluded: false }),
      ],
    });

    expect(previousItems.map((item) => item.invoiceId)).toEqual(['deleted-included']);
    expect(newMonthItems).toEqual([]);
  });

  it('keeps a moved subscription’s history in its recorded collection', () => {
    const { previousItems, newMonthItems } = build({
      collections: ['personal'],
      invoices: [
        invoice({ id: 'sep', collectionId: 'personal', invoiceDate: '2026-09-07' }),
        invoice({ id: 'oct', collectionId: 'personal', invoiceDate: '2026-10-01' }),
      ],
      // Since moved to Work, which isn't routed here.
      subscriptions: [overviewSubscription({ collectionId: 'work', nextInvoiceDate: '2026-11-01' })],
    });

    expect(previousItems.map((item) => [item.invoiceId, item.collectionId])).toEqual([['sep', 'personal']]);
    expect(newMonthItems.map((item) => [item.source, item.collectionId])).toEqual([['recorded', 'personal']]);
  });

  it('routes a moved subscription’s projections through its current collection', () => {
    const { newMonthItems } = build({
      collections: ['personal'],
      subscriptions: [overviewSubscription({ collectionId: 'work', nextInvoiceDate: '2026-10-20' })],
    });

    expect(newMonthItems).toEqual([]);
  });

  it('doesn’t project an occurrence recorded in an unrouted collection before a move', () => {
    const { newMonthItems } = build({
      collections: ['personal'],
      // Recorded while the subscription was in Work, which isn't routed here.
      invoices: [invoice({ id: 'oct-7', collectionId: 'work', invoiceDate: '2026-10-07' })],
      // Since moved to Personal, with a next date that still includes October 7.
      subscriptions: [overviewSubscription({ costFrequency: 'weekly', nextInvoiceDate: '2026-10-07' })],
    });

    expect(newMonthItems.map((item) => [item.source, item.date, item.collectionId])).toEqual([
      ['projected', '2026-10-14', 'personal'],
      ['projected', '2026-10-21', 'personal'],
      ['projected', '2026-10-28', 'personal'],
    ]);
  });

  it('combines recorded and projected weekly occurrences without projecting a recorded one again', () => {
    const { newMonthItems } = build({
      invoices: [
        invoice({ id: 'oct-1', subscriptionId: 'sub-weekly', invoiceDate: '2026-10-01', amount: 500 }),
        invoice({ id: 'oct-8', subscriptionId: 'sub-weekly', invoiceDate: '2026-10-08', amount: 500 }),
      ],
      subscriptions: [
        // A stale next date would otherwise project October 1 and 8 again.
        overviewSubscription({
          id: 'sub-weekly',
          costFrequency: 'weekly',
          nextInvoiceDate: '2026-10-01',
          costAmount: 500,
        }),
      ],
    });

    expect(newMonthItems.map((item) => [item.source, item.date])).toEqual([
      ['recorded', '2026-10-01'],
      ['recorded', '2026-10-08'],
      ['projected', '2026-10-15'],
      ['projected', '2026-10-22'],
      ['projected', '2026-10-29'],
    ]);
  });

  it('excludes inactive and excluded subscriptions from projections', () => {
    const { newMonthItems } = build({
      subscriptions: [
        overviewSubscription({ id: 'inactive', status: 'inactive' }),
        overviewSubscription({ id: 'excluded', notificationsIncluded: false }),
        overviewSubscription({ id: 'kept', nextInvoiceDate: '2026-10-31' }),
        overviewSubscription({ id: 'next-month', nextInvoiceDate: '2026-11-01' }),
      ],
    });

    expect(newMonthItems.map((item) => item.subscriptionId)).toEqual(['kept']);
  });
});
