import { describe, expect, it } from 'vitest';

import {
  candidatesFromAgentOutput,
  getNextInvoiceDateAfterCharge,
  normalizeDomain,
} from '@/features/imports/smart-import/candidates';
import type { SmartImportItem } from '@/features/imports/smart-import/output';

describe('getNextInvoiceDateAfterCharge', () => {
  const today = '2026-09-26';

  it.each([
    ['weekly', '2026-09-22', '2026-09-29'],
    ['monthly', '2026-09-03', '2026-10-03'],
    ['yearly', '2026-02-14', '2027-02-14'],
    ['biennially', '2025-11-01', '2027-11-01'],
  ] as const)('rolls a %s charge forward one period', (frequency, lastChargeDate, expected) => {
    expect(getNextInvoiceDateAfterCharge(lastChargeDate, frequency, today)).toBe(expected);
  });

  it.each([
    ['weekly', '2026-08-01', '2026-09-26'],
    ['monthly', '2026-05-26', '2026-09-26'],
    ['yearly', '2023-10-01', '2026-10-01'],
    ['biennially', '2020-09-25', '2028-09-25'],
  ] as const)('keeps rolling a stale %s charge until it reaches today', (frequency, lastChargeDate, expected) => {
    expect(getNextInvoiceDateAfterCharge(lastChargeDate, frequency, today)).toBe(expected);
  });

  it('never returns the charge date itself, even when it is today', () => {
    expect(getNextInvoiceDateAfterCharge(today, 'monthly', today)).toBe('2026-10-26');
  });

  it('jumps ahead from very old charge dates', () => {
    const started = performance.now();

    expect(getNextInvoiceDateAfterCharge('0001-01-01', 'weekly', today)).toBe('2026-09-28');
    expect(getNextInvoiceDateAfterCharge('1990-03-31', 'monthly', today)).toBe('2026-09-30');
    expect(getNextInvoiceDateAfterCharge('1990-09-26', 'biennially', today)).toBe('2026-09-26');
    expect(performance.now() - started).toBeLessThan(50);
  });

  it('measures each month from the charge date so month ends do not drift', () => {
    expect(getNextInvoiceDateAfterCharge('2026-01-31', 'monthly', '2026-03-15')).toBe('2026-03-31');
  });
});

describe('normalizeDomain', () => {
  it('reduces URLs to a bare lowercase host', () => {
    expect(normalizeDomain('https://www.Netflix.com/browse?x=1')).toBe('netflix.com');
    expect(normalizeDomain(' setapp.com ')).toBe('setapp.com');
    expect(normalizeDomain(null)).toBe('');
  });
});

describe('candidatesFromAgentOutput', () => {
  const context = { today: '2026-09-26', categories: ['Streaming', 'Software'] };

  const item = (overrides: Partial<SmartImportItem> = {}): SmartImportItem => ({
    descriptor: 'NETFLIX.COM 866-579-7172',
    name: 'Netflix',
    domain: 'netflix.com',
    amountCents: 1549,
    currency: 'USD',
    frequency: 'monthly',
    lastChargeDate: '2026-09-12',
    category: 'streaming',
    reason: 'Charged 3× monthly',
    ...overrides,
  });

  it('puts high-confidence USD items in Ready and computes the next invoice', () => {
    const [candidate] = candidatesFromAgentOutput({ highConfidence: [item()], lowConfidence: [] }, context);

    expect(candidate).toEqual({
      group: 'ready',
      error: null,
      reason: 'Charged 3× monthly',
      descriptor: 'NETFLIX.COM 866-579-7172',
      draft: {
        name: 'Netflix',
        iconRef: 'netflix.com',
        // Existing categories keep the collection's spelling.
        category: 'Streaming',
        costAmount: 1549,
        costFrequency: 'monthly',
        nextInvoiceDate: '2026-10-12',
        status: 'active',
        deactivatedAt: null,
      },
    });
  });

  it('puts low-confidence items in Needs review', () => {
    const [candidate] = candidatesFromAgentOutput({ highConfidence: [], lowConfidence: [item()] }, context);

    expect(candidate?.group).toBe('needs_review');
    expect(candidate?.reason).toBe('Charged 3× monthly');
  });

  it('forces non-USD items into Needs review without converting the amount', () => {
    const [candidate] = candidatesFromAgentOutput(
      { highConfidence: [item({ currency: 'eur', amountCents: 999 })], lowConfidence: [] },
      context,
    );

    expect(candidate?.group).toBe('needs_review');
    expect(candidate?.reason).toBe('Charged in EUR. Amount not converted.');
    expect(candidate?.draft.costAmount).toBe(999);
  });

  it('sends items without a domain to Needs fixes', () => {
    const [candidate] = candidatesFromAgentOutput(
      { highConfidence: [item({ domain: null })], lowConfidence: [] },
      context,
    );

    expect(candidate).toMatchObject({ group: 'needs_fixes', error: 'Pick an icon' });
  });

  it('sends items that fail the subscription schema to Needs fixes', () => {
    const [negative, undated] = candidatesFromAgentOutput(
      {
        highConfidence: [item({ amountCents: -1549 }), item({ lastChargeDate: 'Sep 12' })],
        lowConfidence: [],
      },
      context,
    );

    expect(negative).toMatchObject({ group: 'needs_fixes', error: 'Cost must be zero or more' });
    expect(undated).toMatchObject({ group: 'needs_fixes', error: 'Enter a valid next invoice date' });
    expect(undated?.draft.nextInvoiceDate).toBeNull();
  });

  it('keeps new category names as proposed', () => {
    const [candidate] = candidatesFromAgentOutput(
      { highConfidence: [item({ category: 'Fitness ' })], lowConfidence: [] },
      context,
    );

    expect(candidate?.draft.category).toBe('Fitness');
  });

  it('caps the output at 150 items', () => {
    const many = Array.from({ length: 100 }, (_, index) => item({ name: `Service ${index}` }));

    expect(candidatesFromAgentOutput({ highConfidence: many, lowConfidence: many }, context)).toHaveLength(150);
  });
});
