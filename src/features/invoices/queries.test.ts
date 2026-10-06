import { describe, expect, it } from 'vitest';

import { collectionInvoicesQueryKey } from '@/features/invoices/queries';

describe('collection invoice query keys', () => {
  it('include collection and both date boundaries', () => {
    expect(
      collectionInvoicesQueryKey({
        collectionId: 'collection-1',
        startDate: '2026-07-01',
        endDate: '2026-08-01',
      }),
    ).toEqual(['invoices', 'by-collection', 'collection-1', '2026-07-01', '2026-08-01']);
  });
});
