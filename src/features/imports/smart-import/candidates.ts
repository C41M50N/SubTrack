import {
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  parseISO,
} from 'date-fns';
import { z } from 'zod';

import { toCategoryNameKey } from '@/features/categories/names';
import { type ImportCandidate, type SubscriptionDraft, validateDraft } from '@/features/imports/candidates';
import {
  SMART_IMPORT_MAX_ITEMS,
  type SmartImportItem,
  type SmartImportOutput,
} from '@/features/imports/smart-import/output';
import { toDateKey } from '@/features/invoices/domain';
import type { SubscriptionCostFrequency } from '@/features/subscriptions/server';

export const MISSING_ICON_MESSAGE = 'Pick an icon';

const isoDateSchema = z.iso.date();

function addPeriods(date: Date, frequency: SubscriptionCostFrequency, periods: number): Date {
  switch (frequency) {
    case 'weekly':
      return addWeeks(date, periods);
    case 'monthly':
      return addMonths(date, periods);
    case 'yearly':
      return addYears(date, periods);
    case 'biennially':
      return addYears(date, periods * 2);
  }
}

/**
 * A period count whose billing date is still before `today`, so the search
 * below can start near today instead of stepping through every period.
 */
function periodsBeforeToday(charge: Date, today: Date, frequency: SubscriptionCostFrequency): number {
  switch (frequency) {
    case 'weekly':
      return Math.floor(differenceInCalendarDays(today, charge) / 7) - 1;
    case 'monthly':
      return differenceInCalendarMonths(today, charge) - 1;
    case 'yearly':
      return differenceInCalendarYears(today, charge) - 1;
    case 'biennially':
      return Math.floor(differenceInCalendarYears(today, charge) / 2) - 1;
  }
}

/**
 * The first billing date on or after `today`, found by rolling forward from
 * the last charge at least one period. Each candidate is measured from the
 * charge date itself, so a charge on the 31st doesn't drift after February.
 */
export function getNextInvoiceDateAfterCharge(
  lastChargeDate: string,
  frequency: SubscriptionCostFrequency,
  today: string,
): string {
  const charge = parseISO(lastChargeDate);

  for (let periods = Math.max(1, periodsBeforeToday(charge, parseISO(today), frequency)); ; periods += 1) {
    const next = toDateKey(addPeriods(charge, frequency, periods));

    if (next >= today) {
      return next;
    }
  }
}

/** Reduces a URL-ish domain to the bare host logo.dev expects. */
export function normalizeDomain(domain: string | null): string {
  if (domain === null) {
    return '';
  }

  return domain
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[/?#].*$/, '');
}

/** Uses the collection's spelling for a category that already exists. */
function matchCategory(category: string, existingCategories: string[]): string | null {
  const trimmed = category.trim();

  if (trimmed === '') {
    return null;
  }

  const key = toCategoryNameKey(trimmed);

  return existingCategories.find((name) => toCategoryNameKey(name) === key) ?? trimmed;
}

function toCandidate(
  item: SmartImportItem,
  confidence: 'high' | 'low',
  context: { today: string; categories: string[] },
): ImportCandidate {
  const currency = item.currency.trim().toUpperCase();
  const isUsd = currency === 'USD';
  const lastChargeDate = isoDateSchema.safeParse(item.lastChargeDate.trim());

  const draft: SubscriptionDraft = {
    name: item.name.trim(),
    iconRef: normalizeDomain(item.domain),
    category: matchCategory(item.category, context.categories),
    costAmount: item.amountCents,
    costFrequency: item.frequency,
    nextInvoiceDate: lastChargeDate.success
      ? getNextInvoiceDateAfterCharge(lastChargeDate.data, item.frequency, context.today)
      : null,
    status: 'active',
    deactivatedAt: null,
  };

  const base = {
    draft,
    descriptor: item.descriptor.trim() || null,
    // Amounts are never converted, so a foreign charge always needs a look.
    reason: isUsd ? item.reason.trim() || null : `Charged in ${currency || 'another currency'}. Amount not converted.`,
  };

  if (draft.iconRef === '') {
    return { ...base, group: 'needs_fixes', error: MISSING_ICON_MESSAGE };
  }

  const validation = validateDraft(draft);

  if (!validation.success) {
    return { ...base, group: 'needs_fixes', error: validation.error };
  }

  return {
    ...base,
    draft: validation.item,
    group: isUsd && confidence === 'high' ? 'ready' : 'needs_review',
    error: null,
  };
}

/**
 * Turns agent output into review rows. The agent never does date arithmetic;
 * the next invoice date is computed here from the last charge.
 */
export function candidatesFromAgentOutput(
  output: SmartImportOutput,
  context: { today: string; categories: string[] },
): ImportCandidate[] {
  const items = [
    ...output.highConfidence.map((item) => ({ item, confidence: 'high' as const })),
    ...output.lowConfidence.map((item) => ({ item, confidence: 'low' as const })),
  ].slice(0, SMART_IMPORT_MAX_ITEMS);

  return items.map(({ item, confidence }) => toCandidate(item, confidence, context));
}
