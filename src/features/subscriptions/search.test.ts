import { describe, expect, it } from 'vitest';

import {
  getSubscriptionView,
  toSubscriptionRouteSearch,
  validateSubscriptionSearch,
} from '@/features/subscriptions/search';

describe('subscription route search', () => {
  it('uses active as the canonical default', () => {
    expect(validateSubscriptionSearch({})).toEqual({ view: undefined });
    expect(getSubscriptionView({})).toBe('active');
    expect(toSubscriptionRouteSearch('active')).toEqual({ view: undefined });
  });

  it('round-trips the inactive view', () => {
    expect(getSubscriptionView(validateSubscriptionSearch({ view: 'inactive' }))).toBe('inactive');
    expect(toSubscriptionRouteSearch('inactive')).toEqual({ view: 'inactive' });
  });

  it('rejects unknown views', () => {
    expect(validateSubscriptionSearch({ view: 'archived' })).toEqual({ view: undefined });
  });
});
