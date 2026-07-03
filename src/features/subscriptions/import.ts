import Papa from 'papaparse';

import {
  type SubscriptionImportRow,
  subscriptionImportEnvelopeSchema,
  subscriptionImportRowSchema,
} from '@/features/subscriptions/schema';

export type SubscriptionTransferFormat = 'json' | 'csv';

// Maps exported CSV headers to import row keys.
const csvHeaderToField: Record<string, keyof SubscriptionImportRow> = {
  name: 'name',
  collection: 'collection',
  status: 'status',
  category: 'category',
  icon_ref: 'iconRef',
  cost_amount_cents: 'costAmountCents',
  cost_frequency: 'costFrequency',
  next_invoice_date: 'nextInvoiceDate',
};

const requiredCsvHeaders = Object.keys(csvHeaderToField);

function inferFormat(content: string): SubscriptionTransferFormat {
  return content.trimStart().startsWith('{') ? 'json' : 'csv';
}

function parseJsonRows(content: string): unknown[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Import file is not valid JSON.');
  }

  const envelope = subscriptionImportEnvelopeSchema.safeParse(parsed);

  if (!envelope.success) {
    throw new Error('Import file is not a valid SubTrack subscriptions export.');
  }

  return envelope.data.subscriptions;
}

function parseCsvRows(content: string): unknown[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const headers = result.meta.fields ?? [];
  const missing = requiredCsvHeaders.filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    throw new Error(`Import file is missing required columns: ${missing.join(', ')}.`);
  }

  return result.data.map((row) => {
    const record: Record<string, string> = {};

    for (const [header, field] of Object.entries(csvHeaderToField)) {
      record[field] = (row[header] ?? '').trim();
    }

    return record;
  });
}

export function parseSubscriptionImport(input: {
  content: string;
  format?: SubscriptionTransferFormat;
}): SubscriptionImportRow[] {
  const format = input.format ?? inferFormat(input.content);
  const rawRows = format === 'json' ? parseJsonRows(input.content) : parseCsvRows(input.content);

  const rows: SubscriptionImportRow[] = [];
  const errors: string[] = [];

  rawRows.forEach((rawRow, index) => {
    const result = subscriptionImportRowSchema.safeParse(rawRow);

    if (result.success) {
      rows.push(result.data);
      return;
    }

    const issue = result.error.issues[0];
    // Row 1 is the first data row (header row is not counted).
    errors.push(`Row ${index + 1}: ${issue ? `${issue.path.join('.')} ${issue.message}`.trim() : 'invalid'}`);
  });

  if (errors.length > 0) {
    throw new Error(`Import failed. Fix these rows and try again:\n${errors.join('\n')}`);
  }

  return rows;
}
