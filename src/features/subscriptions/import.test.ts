import { describe, expect, it } from 'vitest';

import { serializeSubscriptionsToCsv, serializeSubscriptionsToJson } from '@/features/subscriptions/export';
import { getImportedDeactivatedAt, parseSubscriptionImport } from '@/features/subscriptions/import';

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

// The export's collection is ignored on import.
const { collection: _collection, ...baseRow } = baseRecord;

describe('parseSubscriptionImport', () => {
  it('round-trips deactivatedAt through JSON and CSV', () => {
    const json = serializeSubscriptionsToJson([baseRecord], 'all');
    const csv = serializeSubscriptionsToCsv([baseRecord]);

    expect(parseSubscriptionImport({ content: json })).toEqual({ rows: [baseRow], invalidRows: [] });
    expect(parseSubscriptionImport({ content: csv })).toEqual({ rows: [baseRow], invalidRows: [] });
  });

  it('maps an empty category to Uncategorized in both formats', () => {
    const uncategorized = { ...baseRecord, category: '' };
    const json = serializeSubscriptionsToJson([uncategorized], 'all');
    const csv = serializeSubscriptionsToCsv([uncategorized]);

    expect(parseSubscriptionImport({ content: json }).rows[0]?.category).toBeNull();
    expect(parseSubscriptionImport({ content: csv }).rows[0]?.category).toBeNull();
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

    expect(parseSubscriptionImport({ content: legacyJson }).rows[0]?.deactivatedAt).toBeUndefined();
    expect(parseSubscriptionImport({ content: legacyCsv }).rows[0]?.deactivatedAt).toBeUndefined();
  });

  it('does not require the collection column', () => {
    const csv = [
      'name,status,category,icon_ref,cost_amount_cents,cost_frequency,next_invoice_date',
      'Netflix,active,Entertainment,netflix.com,2299,monthly,2026-10-15',
    ].join('\n');

    expect(parseSubscriptionImport({ content: csv }).rows).toHaveLength(1);
  });

  it('returns invalid rows with their first error instead of rejecting the file', () => {
    const csv = [
      'name,collection,status,category,icon_ref,cost_amount_cents,cost_frequency,next_invoice_date',
      'Netflix,Personal,active,Entertainment,netflix.com,2299,monthly,2026-10-15',
      'Spotify,Personal,active,Music,spotify.com,-5,monthly,2026-10-01',
      ',Personal,active,,,abc,daily,soon',
      'Hulu,Personal,active,,hulu.com,1799,yearly,2026-11-01',
    ].join('\n');

    const parsed = parseSubscriptionImport({ content: csv });

    expect(parsed.rows.map((row) => row.name)).toEqual(['Netflix', 'Hulu']);
    expect(parsed.rows[1]?.category).toBeNull();
    expect(parsed.invalidRows).toEqual([
      {
        values: expect.objectContaining({ name: 'Spotify', costAmountCents: '-5' }),
        error: 'Cost must be zero or more',
      },
      { values: expect.objectContaining({ name: '' }), error: 'Name is required' },
    ]);
  });

  it('flags JSON rows that are not objects', () => {
    const json = JSON.stringify({ type: 'subtrack.subscriptions', version: 1, subscriptions: ['Netflix'] });

    expect(parseSubscriptionImport({ content: json }).invalidRows).toEqual([
      { values: {}, error: 'This row isn’t a subscription' },
    ]);
  });

  it('flags deactivation times in the future', () => {
    const json = serializeSubscriptionsToJson([{ ...baseRecord, deactivatedAt: '2999-01-01T00:00:00.000Z' }], 'all');

    expect(parseSubscriptionImport({ content: json }).invalidRows[0]?.error).toBe(
      'Deactivation time can’t be in the future',
    );
  });

  it('rejects the whole file only when the file itself is unusable', () => {
    expect(() => parseSubscriptionImport({ content: '{ not json', format: 'json' })).toThrow('isn’t valid JSON');
    expect(() => parseSubscriptionImport({ content: '{"type":"other"}' })).toThrow(
      'isn’t a SubTrack subscriptions export',
    );
    expect(() => parseSubscriptionImport({ content: 'name,status\nNetflix,active' })).toThrow(
      'missing required columns: category, icon_ref',
    );
  });
});

describe('getImportedDeactivatedAt', () => {
  const importedAt = new Date('2026-09-23T12:00:00.000Z');

  it('uses one import timestamp when an inactive row has no lifecycle timestamp', () => {
    expect(getImportedDeactivatedAt({ status: 'inactive', deactivatedAt: null }, importedAt)).toBe(importedAt);
  });

  it('clears a supplied timestamp for an active row', () => {
    expect(
      getImportedDeactivatedAt({ status: 'active', deactivatedAt: baseRecord.deactivatedAt }, importedAt),
    ).toBeNull();
  });

  it('rejects an inactive timestamp more than five minutes in the future', () => {
    expect(() =>
      getImportedDeactivatedAt({ status: 'inactive', deactivatedAt: '2026-09-23T12:05:01.000Z' }, importedAt),
    ).toThrow('Deactivation time can’t be in the future');
  });
});
