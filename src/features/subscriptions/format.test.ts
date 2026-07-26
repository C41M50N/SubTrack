import { describe, expect, it } from 'vitest';

import { formatInvoiceDate, formatInvoiceDistance } from '@/features/subscriptions/format';

/** Fixed reference point so distances never depend on the wall clock. */
const NOW = new Date(2026, 0, 10);

function distance(isoDate: string): string {
  return formatInvoiceDistance(isoDate, NOW);
}

describe('formatInvoiceDate', () => {
  it('formats an ISO date as an abbreviated month, day, and year', () => {
    expect(formatInvoiceDate('2026-01-15')).toBe('Jan 15, 2026');
  });

  it('does not pad single-digit days', () => {
    expect(formatInvoiceDate('2026-03-05')).toBe('Mar 5, 2026');
  });
});

describe('formatInvoiceDistance', () => {
  it('names the current and adjacent days', () => {
    expect(distance('2026-01-10')).toBe('Today');
    expect(distance('2026-01-11')).toBe('Tomorrow');
    expect(distance('2026-01-09')).toBe('Yesterday');
  });

  it('counts upcoming days', () => {
    expect(distance('2026-01-12')).toBe('in 2 days');
    expect(distance('2026-01-13')).toBe('in 3 days');
  });

  it('counts elapsed days', () => {
    expect(distance('2026-01-08')).toBe('2 days ago');
  });

  it('uses days through the 60-day boundary', () => {
    expect(distance('2026-03-11')).toBe('in 60 days');
    expect(distance('2025-11-11')).toBe('60 days ago');
  });

  it('switches to months past the 60-day boundary', () => {
    expect(distance('2026-03-12')).toBe('in 2 months');
    expect(distance('2025-11-10')).toBe('2 months ago');
  });

  it('handles long horizons such as biennial renewals', () => {
    expect(distance('2028-01-10')).toBe('in 24 months');
  });

  it('ignores the time component of the reference date', () => {
    const lateAtNight = new Date(2026, 0, 10, 23, 59, 59);

    expect(formatInvoiceDistance('2026-01-11', lateAtNight)).toBe('Tomorrow');
  });

  it('measures whole calendar days rather than elapsed time', () => {
    const earlyMorning = new Date(2026, 0, 10, 0, 30);

    expect(formatInvoiceDistance('2026-01-13', earlyMorning)).toBe('in 3 days');
  });
});
