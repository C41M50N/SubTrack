import { describe, expect, it } from 'vitest';

import { serializeSubscriptionsToCsv, serializeSubscriptionsToJson } from '@/features/subscriptions/export';
import { getImportedDeactivatedAt, parseSubscriptionImport } from '@/features/subscriptions/import';
import type { SubscriptionImportRow } from '@/features/subscriptions/schema';

const baseRecord = {
  name: 'Netflix',
  collection: 'Personal',
  status: 'inactive' as const,
  category: 'Entertainment',
  iconRef: 'netflix.com',
  costAmountCents: 2299,
  costFrequency: 'monthly' as const,
  nextInvoiceDate: '2026-10-15',
  deactivatedAt: '2026-09-20T14:30:00.000Z',
};

describe('subscription transfer lifecycle data', () => {
  it('round-trips deactivatedAt through JSON and CSV', () => {
    const json = serializeSubscriptionsToJson([baseRecord], 'all');
    const csv = serializeSubscriptionsToCsv([baseRecord]);

    expect(parseSubscriptionImport({ content: json })).toEqual([baseRecord]);
    expect(parseSubscriptionImport({ content: csv })).toEqual([baseRecord]);
  });

  it('accepts exports without deactivatedAt', () => {
    const legacyJson = JSON.stringify({
      type: 'subtrack.subscriptions',
      version: 1,
      subscriptions: [{ ...baseRecord, deactivatedAt: undefined }],
    });
    const legacyCsv = [
      'name,collection,status,category,icon_ref,cost_amount_cents,cost_frequency,next_invoice_date',
      'Netflix,Personal,inactive,Entertainment,netflix.com,2299,monthly,2026-10-15',
    ].join('\n');

    expect(parseSubscriptionImport({ content: legacyJson })[0]?.deactivatedAt).toBeUndefined();
    expect(parseSubscriptionImport({ content: legacyCsv })[0]?.deactivatedAt).toBeUndefined();
  });
});

describe('getImportedDeactivatedAt', () => {
  const importedAt = new Date('2026-09-23T12:00:00.000Z');

  it('uses one import timestamp when an inactive row has no lifecycle timestamp', () => {
    const row = { ...baseRecord, deactivatedAt: undefined } satisfies SubscriptionImportRow;
    expect(getImportedDeactivatedAt(row, importedAt)).toBe(importedAt);
  });

  it('clears a supplied timestamp for an active row', () => {
    const row = { ...baseRecord, status: 'active' as const } satisfies SubscriptionImportRow;
    expect(getImportedDeactivatedAt(row, importedAt)).toBeNull();
  });

  it('rejects an inactive timestamp more than five minutes in the future', () => {
    const row = {
      ...baseRecord,
      deactivatedAt: '2026-09-23T12:05:01.000Z',
    } satisfies SubscriptionImportRow;

    expect(() => getImportedDeactivatedAt(row, importedAt)).toThrow('Deactivation time cannot be in the future');
  });
});
