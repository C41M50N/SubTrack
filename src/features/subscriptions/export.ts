import Papa from 'papaparse';
import slugify from 'slugify';

import type { Subscription } from '@/features/subscriptions/server';

export type SubscriptionTransferFormat = 'json' | 'csv';

export type SubscriptionExportScope = 'all' | { collection: string };

export type SubscriptionExportRecord = {
  name: string;
  collection: string;
  status: string;
  category: string;
  iconRef: string;
  costAmountCents: number;
  costFrequency: string;
  nextInvoiceDate: string;
};

const csvHeaders = [
  'name',
  'collection',
  'status',
  'category',
  'icon_ref',
  'cost_amount_cents',
  'cost_frequency',
  'next_invoice_date',
];

export function toSubscriptionExportRecords(
  subscriptions: Subscription[],
  collectionNameById: Map<string, string>,
): SubscriptionExportRecord[] {
  return subscriptions.map((subscription) => ({
    name: subscription.name,
    collection: collectionNameById.get(subscription.collectionId) ?? '',
    status: subscription.status,
    category: subscription.category,
    iconRef: subscription.iconRef,
    costAmountCents: subscription.costAmount,
    costFrequency: subscription.costFrequency,
    nextInvoiceDate: subscription.nextInvoiceDate,
  }));
}

export function serializeSubscriptionsToJson(
  records: SubscriptionExportRecord[],
  scope: SubscriptionExportScope,
  exportedAt = new Date(),
): string {
  return JSON.stringify(
    {
      type: 'subtrack.subscriptions',
      version: 1,
      exportedAt: exportedAt.toISOString(),
      scope,
      subscriptions: records,
    },
    null,
    2,
  );
}

export function serializeSubscriptionsToCsv(records: SubscriptionExportRecord[]): string {
  return Papa.unparse({
    fields: csvHeaders,
    data: records.map((record) => [
      record.name,
      record.collection,
      record.status,
      record.category,
      record.iconRef,
      String(record.costAmountCents),
      record.costFrequency,
      record.nextInvoiceDate,
    ]),
  });
}

export function formatExportDate(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

export function buildExportFilename(input: {
  scope: 'all' | { collectionName: string; collectionId: string };
  format: SubscriptionTransferFormat;
  date?: Date;
}): string {
  const datePart = formatExportDate(input.date);

  if (input.scope === 'all') {
    return `subtrack-subscriptions-all-${datePart}.${input.format}`;
  }

  const slug = slugify(input.scope.collectionName, { lower: true, strict: true }) || input.scope.collectionId;

  return `subtrack-subscriptions-collection-${slug}-${datePart}.${input.format}`;
}

export function exportContentType(format: SubscriptionTransferFormat): string {
  return format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8';
}
