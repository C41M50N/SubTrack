import { describe, expect, it } from 'vitest';

import { getInvoiceRouteState, toInvoiceRouteSearch, validateInvoiceSearch } from '@/features/invoices/search';

const now = new Date(2026, 6, 29);

describe('invoice route search', () => {
  it('defaults invalid and missing values to upcoming and the current local month', () => {
    const search = validateInvoiceSearch({ view: 'paid', month: '2026-13' });

    expect(getInvoiceRouteState(search, now)).toEqual({ view: 'upcoming', month: '2026-07' });
  });

  it('accepts history and a valid calendar month', () => {
    const search = validateInvoiceSearch({ view: 'history', month: '2024-02' });

    expect(getInvoiceRouteState(search, now)).toEqual({ view: 'history', month: '2024-02' });
  });

  it('omits default values from generated search state', () => {
    expect(toInvoiceRouteSearch({ view: 'upcoming', month: '2026-07' }, now)).toEqual({
      view: undefined,
      month: undefined,
    });
    expect(toInvoiceRouteSearch({ view: 'history', month: '2026-08' }, now)).toEqual({
      view: 'history',
      month: '2026-08',
    });
  });
});
