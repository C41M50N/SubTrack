import Papa from 'papaparse';

import {
  type ImportSubscriptionItem,
  isDeactivatedAtInFuture,
  type SubscriptionImportRow,
  subscriptionImportEnvelopeSchema,
  subscriptionImportRowSchema,
} from '@/features/subscriptions/schema';
import { UserFacingError } from '@/lib/errors';

export type SubscriptionTransferFormat = 'json' | 'csv';

// Maps exported CSV headers to import row keys. The `collection` column is
// ignored because every row is imported into the chosen collection.
const csvHeaderToField: Record<string, keyof SubscriptionImportRow> = {
  name: 'name',
  status: 'status',
  category: 'category',
  icon_ref: 'iconRef',
  cost_amount_cents: 'costAmountCents',
  cost_frequency: 'costFrequency',
  next_invoice_date: 'nextInvoiceDate',
};

const optionalCsvHeaderToField = {
  deactivated_at: 'deactivatedAt',
} as const;

const requiredCsvHeaders = Object.keys(csvHeaderToField);

function inferFormat(content: string): SubscriptionTransferFormat {
  return content.trimStart().startsWith('{') ? 'json' : 'csv';
}

function parseJsonRows(content: string): unknown[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('This file isn’t valid JSON.');
  }

  const envelope = subscriptionImportEnvelopeSchema.safeParse(parsed);

  if (!envelope.success) {
    throw new Error('This file isn’t a SubTrack subscriptions export.');
  }

  return envelope.data.subscriptions;
}

function parseCsvRows(content: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const headers = result.meta.fields ?? [];
  const missing = requiredCsvHeaders.filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    throw new Error(`This file is missing required columns: ${missing.join(', ')}.`);
  }

  return result.data.map((row) => {
    const record: Record<string, string> = {};

    for (const [header, field] of Object.entries(csvHeaderToField)) {
      record[field] = (row[header] ?? '').trim();
    }

    for (const [header, field] of Object.entries(optionalCsvHeaderToField)) {
      const value = (row[header] ?? '').trim();

      if (value) {
        record[field] = value;
      }
    }

    return record;
  });
}

export type InvalidSubscriptionImportRow = {
  /** The row as it appears in the file, keyed like `SubscriptionImportRow`. */
  values: Record<string, unknown>;
  /** The row's first validation error. */
  error: string;
};

export type ParsedSubscriptionImport = {
  rows: SubscriptionImportRow[];
  invalidRows: InvalidSubscriptionImportRow[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parses a SubTrack JSON or CSV export into valid and invalid rows.
 *
 * Throws only when the file itself is unusable: malformed JSON, a JSON
 * envelope that isn't a SubTrack export, or a CSV missing required columns.
 * A bad row is returned with its first error so it can be fixed in review.
 */
export function parseSubscriptionImport(input: {
  content: string;
  format?: SubscriptionTransferFormat;
}): ParsedSubscriptionImport {
  const format = input.format ?? inferFormat(input.content);
  const rawRows = format === 'json' ? parseJsonRows(input.content) : parseCsvRows(input.content);

  const rows: SubscriptionImportRow[] = [];
  const invalidRows: InvalidSubscriptionImportRow[] = [];

  for (const rawRow of rawRows) {
    if (!isRecord(rawRow)) {
      invalidRows.push({ values: {}, error: 'This row isn’t a subscription' });
      continue;
    }

    const result = subscriptionImportRowSchema.safeParse(rawRow);

    if (result.success) {
      rows.push(result.data);
    } else {
      invalidRows.push({ values: rawRow, error: result.error.issues[0]?.message ?? 'This row is invalid' });
    }
  }

  return { rows, invalidRows };
}

export function getImportedDeactivatedAt(
  item: Pick<ImportSubscriptionItem, 'status' | 'deactivatedAt'>,
  importedAt: Date,
): Date | null {
  if (item.status === 'active') {
    return null;
  }

  const deactivatedAt = item.deactivatedAt ? new Date(item.deactivatedAt) : importedAt;

  if (item.deactivatedAt && isDeactivatedAtInFuture(item.deactivatedAt, importedAt)) {
    throw new UserFacingError('Deactivation time can’t be in the future');
  }

  return deactivatedAt;
}
