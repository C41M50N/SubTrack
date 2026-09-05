import { describe, expect, it } from 'vitest';

import {
  buildCategoryBreakdown,
  buildSpendTrend,
  countCategories,
  getRecordedTrendRange,
  invoicesInCurrentMonth,
} from '@/features/dashboard/domain';
import type { ProjectedInvoice, RecordedInvoice } from '@/features/invoices/domain';

const now = new Date(2026, 8, 4); // 2026-09-04, local time

function recorded(overrides: Partial<RecordedInvoice> = {}): RecordedInvoice {
  return {
    kind: 'recorded',
    id: 'inv-1',
    subscriptionId: 'sub-1',
    name: 'Alpha',
    iconRef: 'alpha.com',
    category: 'Work',
    amount: 1000,
    date: '2026-09-01',
    ...overrides,
  };
}

function projected(overrides: Partial<ProjectedInvoice> = {}): ProjectedInvoice {
  return {
    kind: 'upcoming',
    id: 'sub-1:2026-09-15',
    subscriptionId: 'sub-1',
    name: 'Alpha',
    iconRef: 'alpha.com',
    category: 'Work',
    amount: 1000,
    frequency: 'monthly',
    date: '2026-09-15',
    ...overrides,
  };
}

describe('getRecordedTrendRange', () => {
  it('spans six past months through the end of the current month', () => {
    expect(getRecordedTrendRange(now)).toEqual({ startDate: '2026-03-01', endDate: '2026-10-01' });
  });
});

describe('buildSpendTrend', () => {
  it('emits one zero-filled point per month across the window', () => {
    const points = buildSpendTrend([], [], now);

    expect(points).toHaveLength(13);
    expect(points[0].monthKey).toBe('2026-03');
    expect(points[6].monthKey).toBe('2026-09');
    expect(points[12].monthKey).toBe('2027-03');
    expect(points.every((point) => point.recordedCents === 0 && point.projectedCents === 0)).toBe(true);
  });

  it('marks past, current, and future months', () => {
    const statuses = buildSpendTrend([], [], now).map((point) => point.status);

    expect(statuses.slice(0, 6).every((status) => status === 'past')).toBe(true);
    expect(statuses[6]).toBe('current');
    expect(statuses.slice(7).every((status) => status === 'future')).toBe(true);
  });

  it('labels the first bar and January with a year', () => {
    const labels = buildSpendTrend([], [], now).map((point) => point.label);

    expect(labels[0]).toBe('Mar ’26');
    expect(labels[1]).toBe('Apr');
    expect(labels[10]).toBe('Jan ’27');
    expect(labels[12]).toBe('Mar');
  });

  it('buckets recorded and projected invoices into their months', () => {
    const points = buildSpendTrend(
      [recorded({ id: 'a', date: '2026-07-10', amount: 500 }), recorded({ id: 'b', date: '2026-07-20', amount: 250 })],
      [projected({ id: 'c', date: '2026-11-03', amount: 900 })],
      now,
    );

    expect(points.find((point) => point.monthKey === '2026-07')).toMatchObject({
      recordedCents: 750,
      projectedCents: 0,
    });
    expect(points.find((point) => point.monthKey === '2026-11')).toMatchObject({
      recordedCents: 0,
      projectedCents: 900,
    });
  });

  it('splits the current month between recorded-to-date and projected remainder', () => {
    const points = buildSpendTrend(
      [recorded({ date: '2026-09-01', amount: 1200 })],
      [projected({ date: '2026-09-20', amount: 800 })],
      now,
    );

    expect(points[6]).toMatchObject({ monthKey: '2026-09', recordedCents: 1200, projectedCents: 800 });
  });

  it('ignores invoices outside the window and stale projections in the past', () => {
    const points = buildSpendTrend(
      [recorded({ date: '2026-02-28', amount: 100 })],
      [
        projected({ id: 'stale', date: '2026-08-15', amount: 100 }),
        projected({ id: 'far', date: '2027-04-01', amount: 100 }),
      ],
      now,
    );

    expect(points.every((point) => point.recordedCents === 0 && point.projectedCents === 0)).toBe(true);
  });
});

describe('buildCategoryBreakdown', () => {
  it('groups by category, ranks by monthly cost, and computes shares', () => {
    const breakdown = buildCategoryBreakdown([
      { category: 'Streaming', costAmount: 1000, costFrequency: 'monthly', nextInvoiceDate: '2026-09-10' },
      { category: 'Streaming', costAmount: 12000, costFrequency: 'yearly', nextInvoiceDate: '2026-09-10' },
      { category: 'Work', costAmount: 3000, costFrequency: 'monthly', nextInvoiceDate: '2026-09-10' },
    ]);

    expect(breakdown).toEqual([
      { category: 'Work', monthlyCents: 3000, count: 1, share: 0.6 },
      { category: 'Streaming', monthlyCents: 2000, count: 2, share: 0.4 },
    ]);
  });

  it('labels missing categories and breaks cost ties by name', () => {
    const breakdown = buildCategoryBreakdown([
      { category: null, costAmount: 500, costFrequency: 'monthly', nextInvoiceDate: '2026-09-10' },
      { category: 'Music', costAmount: 500, costFrequency: 'monthly', nextInvoiceDate: '2026-09-10' },
    ]);

    expect(breakdown.map((entry) => entry.category)).toEqual(['Music', 'Uncategorized']);
  });

  it('returns zero shares when nothing costs anything', () => {
    const breakdown = buildCategoryBreakdown([
      { category: 'Free', costAmount: 0, costFrequency: 'monthly', nextInvoiceDate: '2026-09-10' },
    ]);

    expect(breakdown[0].share).toBe(0);
  });
});

describe('countCategories', () => {
  it('counts distinct named categories only', () => {
    expect(countCategories([{ category: 'A' }, { category: 'A' }, { category: 'B' }, { category: null }])).toBe(2);
  });
});

describe('invoicesInCurrentMonth', () => {
  it('keeps only invoices dated in the month of now', () => {
    const invoices = [recorded({ id: 'in', date: '2026-09-30' }), recorded({ id: 'out', date: '2026-08-31' })];

    expect(invoicesInCurrentMonth(invoices, now).map((invoice) => invoice.id)).toEqual(['in']);
  });
});
