import type { z } from 'zod';

import type { ParsedSubscriptionImport } from '@/features/subscriptions/import';
import {
  type ImportSubscriptionItem,
  importSubscriptionItemSchema,
  isDeactivatedAtInFuture,
} from '@/features/subscriptions/schema';
import type { SubscriptionCostFrequency, SubscriptionStatus } from '@/features/subscriptions/server';

export type ReviewGroup = 'ready' | 'needs_review' | 'needs_fixes';

/**
 * Subscription values as found in a file or statement. Any field can be
 * missing or invalid until the row is fixed in review.
 */
export type SubscriptionDraft = {
  name: string;
  iconRef: string;
  category: string | null;
  costAmount: number | null;
  costFrequency: SubscriptionCostFrequency | null;
  nextInvoiceDate: string | null;
  status: SubscriptionStatus;
  deactivatedAt: string | null;
};

/** One subscription found by an import, before review state is added. */
export type ImportCandidate = {
  group: ReviewGroup;
  draft: SubscriptionDraft;
  /** The first validation error. Set only for `needs_fixes` rows. */
  error: string | null;
  /** Why the agent found this item and how sure it is. Smart import only. */
  reason: string | null;
  /** The raw statement text, e.g. `PADDLE.NET* SETAPP`. Smart import only. */
  descriptor: string | null;
};

export type DraftValidation = { success: true; item: ImportSubscriptionItem } | { success: false; error: string };

export function validateDraft(draft: SubscriptionDraft): DraftValidation {
  const result = importSubscriptionItemSchema.safeParse(draft);

  if (result.success) {
    return { success: true, item: result.data };
  }

  return { success: false, error: result.error.issues[0]?.message ?? 'This row is invalid' };
}

const fields = importSubscriptionItemSchema.shape;

function pick<T>(schema: z.ZodType<T>, value: unknown): T | null {
  const result = schema.safeParse(value);

  return result.success ? result.data : null;
}

function toText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  return typeof value === 'number' ? String(value) : '';
}

// CSV cells are strings. An empty cell stays empty rather than becoming 0.
function toNumber(value: unknown): unknown {
  return typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
}

/**
 * Keeps whatever is usable from an invalid export row so the review table and
 * the edit form can show it. Unusable values become empty.
 */
export function draftFromExportValues(values: Record<string, unknown>): SubscriptionDraft {
  const status = pick(fields.status, values.status) ?? 'active';
  const deactivatedAt = pick(fields.deactivatedAt, values.deactivatedAt);

  return {
    name: toText(values.name),
    iconRef: toText(values.iconRef),
    category: toText(values.category) || null,
    costAmount: pick(fields.costAmount, toNumber(values.costAmountCents)),
    costFrequency: pick(fields.costFrequency, values.costFrequency),
    nextInvoiceDate: pick(fields.nextInvoiceDate, values.nextInvoiceDate),
    status,
    deactivatedAt:
      status === 'inactive' && deactivatedAt && !isDeactivatedAtInFuture(deactivatedAt) ? deactivatedAt : null,
  };
}

/** Valid export rows are Ready. Invalid rows need fixes. */
export function candidatesFromExport(parsed: ParsedSubscriptionImport): ImportCandidate[] {
  const valid = parsed.rows.map(
    (row): ImportCandidate => ({
      group: 'ready',
      draft: {
        name: row.name,
        iconRef: row.iconRef,
        category: row.category,
        costAmount: row.costAmountCents,
        costFrequency: row.costFrequency,
        nextInvoiceDate: row.nextInvoiceDate,
        status: row.status,
        deactivatedAt: row.status === 'inactive' ? (row.deactivatedAt ?? null) : null,
      },
      error: null,
      reason: null,
      descriptor: null,
    }),
  );

  const invalid = parsed.invalidRows.map(
    (row): ImportCandidate => ({
      group: 'needs_fixes',
      draft: draftFromExportValues(row.values),
      error: row.error,
      reason: null,
      descriptor: null,
    }),
  );

  return [...valid, ...invalid];
}
