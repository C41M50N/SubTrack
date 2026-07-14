import { describe, expect, it } from 'vitest';

import {
  buildMonthlyBreakdown,
  effectiveMonthlyCents,
  effectiveYearlyCents,
  sumEffectiveMonthlyCents,
  sumEffectiveYearlyCents,
  type CostInput,
} from '@/features/subscriptions/cost';

function sub(overrides: Partial<CostInput>): CostInput {
  return {
    costAmount: 1000,
    costFrequency: 'monthly',
    nextInvoiceDate: '2026-01-15',
    ...overrides,
  };
}

describe('effectiveMonthlyCents', () => {
  it('passes monthly through unchanged', () => {
    expect(effectiveMonthlyCents(sub({ costAmount: 1599, costFrequency: 'monthly' }))).toBe(1599);
  });

  it('annualizes weekly then divides across 12 months', () => {
    expect(effectiveMonthlyCents(sub({ costAmount: 1200, costFrequency: 'weekly' }))).toBe((1200 * 52) / 12);
  });

  it('divides yearly across 12 months', () => {
    expect(effectiveMonthlyCents(sub({ costAmount: 12000, costFrequency: 'yearly' }))).toBe(1000);
  });

  it('divides biennial across 24 months', () => {
    expect(effectiveMonthlyCents(sub({ costAmount: 24000, costFrequency: 'biennially' }))).toBe(1000);
  });
});

describe('effectiveYearlyCents', () => {
  it('multiplies monthly by 12', () => {
    expect(effectiveYearlyCents(sub({ costAmount: 1000, costFrequency: 'monthly' }))).toBe(12000);
  });

  it('multiplies weekly by 52', () => {
    expect(effectiveYearlyCents(sub({ costAmount: 500, costFrequency: 'weekly' }))).toBe(26000);
  });

  it('passes yearly through unchanged', () => {
    expect(effectiveYearlyCents(sub({ costAmount: 9900, costFrequency: 'yearly' }))).toBe(9900);
  });

  it('halves biennial', () => {
    expect(effectiveYearlyCents(sub({ costAmount: 20000, costFrequency: 'biennially' }))).toBe(10000);
  });
});

describe('sum helpers', () => {
  it('sums effective monthly and yearly across mixed cadences', () => {
    const items = [
      sub({ costAmount: 1000, costFrequency: 'monthly' }),
      sub({ costAmount: 12000, costFrequency: 'yearly' }),
    ];

    expect(sumEffectiveMonthlyCents(items)).toBe(2000);
    expect(sumEffectiveYearlyCents(items)).toBe(24000);
  });
});

describe('buildMonthlyBreakdown', () => {
  const from = new Date(2026, 0, 10); // Jan 10, 2026

  it('produces the requested number of consecutive month buckets', () => {
    const entries = buildMonthlyBreakdown([], from, 12);

    expect(entries).toHaveLength(12);
    expect(entries[0].monthKey).toBe('2026-01');
    expect(entries[0].label).toBe('Jan 2026');
    expect(entries[11].monthKey).toBe('2026-12');
    expect(entries.every((entry) => entry.totalCents === 0)).toBe(true);
  });

  it('buckets a monthly subscription into every month', () => {
    const entries = buildMonthlyBreakdown(
      [sub({ costAmount: 1500, costFrequency: 'monthly', nextInvoiceDate: '2026-01-20' })],
      from,
      12,
    );

    expect(entries.every((entry) => entry.totalCents === 1500)).toBe(true);
  });

  it('buckets a yearly subscription into only its billed month', () => {
    const entries = buildMonthlyBreakdown(
      [sub({ costAmount: 9900, costFrequency: 'yearly', nextInvoiceDate: '2026-03-05' })],
      from,
      12,
    );

    expect(entries.find((entry) => entry.monthKey === '2026-03')?.totalCents).toBe(9900);
    expect(entries.filter((entry) => entry.totalCents > 0)).toHaveLength(1);
  });

  it('rolls a past invoice date forward to the window', () => {
    const entries = buildMonthlyBreakdown(
      [sub({ costAmount: 500, costFrequency: 'monthly', nextInvoiceDate: '2025-06-15' })],
      from,
      3,
    );

    expect(entries.map((entry) => entry.totalCents)).toEqual([500, 500, 500]);
  });

  it('bills a weekly subscription multiple times within a month', () => {
    const entries = buildMonthlyBreakdown(
      [sub({ costAmount: 100, costFrequency: 'weekly', nextInvoiceDate: '2026-01-01' })],
      from,
      1,
    );

    // Jan 1, 8, 15, 22, 29 all land in January 2026.
    expect(entries[0].totalCents).toBe(500);
  });

  it('excludes a biennial invoice that falls outside the window', () => {
    const entries = buildMonthlyBreakdown(
      [sub({ costAmount: 5000, costFrequency: 'biennially', nextInvoiceDate: '2027-08-01' })],
      from,
      12,
    );

    expect(entries.every((entry) => entry.totalCents === 0)).toBe(true);
  });
});
