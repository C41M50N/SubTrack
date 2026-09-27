import { dedupeCategoryNames, toCategoryNameKey } from '@/features/categories/names';
import {
  type ImportCandidate,
  type ReviewGroup,
  type SubscriptionDraft,
  validateDraft,
} from '@/features/imports/candidates';
import { effectiveMonthlyCents } from '@/features/subscriptions/cost';
import { type ImportSubscriptionItem, MAX_IMPORT_ITEMS } from '@/features/subscriptions/schema';

export const REVIEW_GROUPS: ReviewGroup[] = ['ready', 'needs_review', 'needs_fixes'];

export const reviewGroupLabels: Record<ReviewGroup, string> = {
  ready: 'Ready',
  needs_review: 'Needs review',
  needs_fixes: 'Needs fixes',
};

export type ReviewRow = ImportCandidate & {
  id: string;
  /** Sort position within the row's group. A row moved into a group goes last. */
  order: number;
};

export type ReviewState = {
  rows: ReviewRow[];
  selectedIds: ReadonlySet<string>;
  /** Category names that don't exist in the target collection yet. */
  pendingCategories: string[];
  /** Whether the user has edited a row or changed the selection. */
  touched: boolean;
};

/** The target collection's subscriptions and category names. */
export type ReviewContext = {
  subscriptions: { name: string; iconRef: string }[];
  categories: string[];
};

export type DuplicateIndex = { names: ReadonlySet<string>; iconRefs: ReadonlySet<string> };

function toMatchKey(value: string): string {
  return value.trim().toLowerCase();
}

export function buildDuplicateIndex(subscriptions: ReviewContext['subscriptions']): DuplicateIndex {
  return {
    names: new Set(subscriptions.map((subscription) => toMatchKey(subscription.name))),
    iconRefs: new Set(subscriptions.map((subscription) => toMatchKey(subscription.iconRef))),
  };
}

/**
 * A row likely duplicates a subscription already in the collection, active or
 * inactive, when the names match case-insensitively or the icons match.
 */
export function isLikelyDuplicate(draft: Pick<SubscriptionDraft, 'name' | 'iconRef'>, index: DuplicateIndex): boolean {
  const name = toMatchKey(draft.name);
  const iconRef = toMatchKey(draft.iconRef);

  return (name !== '' && index.names.has(name)) || (iconRef !== '' && index.iconRefs.has(iconRef));
}

export function isSelectable(row: Pick<ReviewRow, 'group'>): boolean {
  return row.group !== 'needs_fixes';
}

/** Whether a category name is new to the target collection. */
export function isNewCategory(category: string | null, existingCategories: string[]): boolean {
  if (category === null) {
    return false;
  }

  const key = toCategoryNameKey(category);

  return !existingCategories.some((name) => toCategoryNameKey(name) === key);
}

function withPendingCategories(pending: string[], names: (string | null)[], existingCategories: string[]): string[] {
  const added = names.filter((name): name is string => name !== null && isNewCategory(name, existingCategories));

  return dedupeCategoryNames([...pending, ...added]);
}

function toReviewRow(candidate: ImportCandidate, index: number): ReviewRow {
  const base = { ...candidate, id: `row-${index}`, order: index };

  if (candidate.group === 'needs_fixes') {
    return { ...base, error: candidate.error ?? 'This row is invalid' };
  }

  const validation = validateDraft(candidate.draft);

  return validation.success
    ? { ...base, draft: validation.item, error: null }
    : { ...base, group: 'needs_fixes', error: validation.error };
}

/**
 * Builds the review step. Ready rows start selected, other rows start cleared,
 * and likely duplicates start cleared in every group. A row whose values don't
 * validate always lands in Needs fixes, whatever group it was given.
 */
export function createReviewState(candidates: ImportCandidate[], context: ReviewContext): ReviewState {
  const duplicates = buildDuplicateIndex(context.subscriptions);
  const selectedIds = new Set<string>();

  const rows = candidates.map((candidate, index) => {
    const row = toReviewRow(candidate, index);

    if (row.group === 'ready' && !isLikelyDuplicate(row.draft, duplicates)) {
      selectedIds.add(row.id);
    }

    return row;
  });

  return {
    rows,
    selectedIds,
    pendingCategories: withPendingCategories(
      [],
      rows.map((row) => row.draft.category),
      context.categories,
    ),
    touched: false,
  };
}

/** Rows split into their groups in display order. Empty groups are left out. */
export function groupReviewRows(rows: ReviewRow[]): { group: ReviewGroup; rows: ReviewRow[] }[] {
  return REVIEW_GROUPS.map((group) => ({
    group,
    rows: rows.filter((row) => row.group === group).sort((a, b) => a.order - b.order),
  })).filter((section) => section.rows.length > 0);
}

/** Selects or clears rows. Rows that can't be selected are ignored. */
export function setRowsSelected(state: ReviewState, rowIds: string[], selected: boolean): ReviewState {
  const selectableIds = new Set(state.rows.filter(isSelectable).map((row) => row.id));
  const selectedIds = new Set(state.selectedIds);

  for (const rowId of rowIds) {
    if (!selectableIds.has(rowId)) {
      continue;
    }

    if (selected) {
      selectedIds.add(rowId);
    } else {
      selectedIds.delete(rowId);
    }
  }

  return { ...state, selectedIds, touched: true };
}

/**
 * Applies a saved edit. Saving counts as verifying the row, so it moves to
 * Ready, goes to the end of that group, and becomes selected.
 */
export function applyRowEdit(
  state: ReviewState,
  rowId: string,
  item: ImportSubscriptionItem,
  existingCategories: string[],
): ReviewState {
  const lastOrder = Math.max(...state.rows.map((row) => row.order));
  const rows = state.rows.map((row): ReviewRow => {
    if (row.id !== rowId) {
      return row;
    }

    return {
      ...row,
      draft: item,
      error: null,
      group: 'ready',
      order: row.group === 'ready' ? row.order : lastOrder + 1,
    };
  });

  return {
    ...state,
    rows,
    selectedIds: new Set(state.selectedIds).add(rowId),
    pendingCategories: withPendingCategories(state.pendingCategories, [item.category], existingCategories),
    touched: true,
  };
}

/** Adds a category created while editing a row so every row can use it. */
export function addPendingCategory(state: ReviewState, name: string, existingCategories: string[]): ReviewState {
  return {
    ...state,
    pendingCategories: withPendingCategories(state.pendingCategories, [name.trim()], existingCategories),
  };
}

/** The validated items to import, in display order. */
export function getSelectedItems(state: ReviewState): ImportSubscriptionItem[] {
  return groupReviewRows(state.rows)
    .flatMap((section) => section.rows)
    .filter((row) => isSelectable(row) && state.selectedIds.has(row.id))
    .flatMap((row) => {
      const validation = validateDraft(row.draft);

      return validation.success ? [validation.item] : [];
    });
}

/**
 * The selection count and the monthly spend it adds. Inactive rows are
 * counted but add nothing to spend.
 */
export function summarizeSelection(items: ImportSubscriptionItem[]): { count: number; monthlyCents: number } {
  const monthlyCents = items
    .filter((item) => item.status === 'active')
    .reduce((total, item) => total + effectiveMonthlyCents(item), 0);

  return { count: items.length, monthlyCents };
}

export function formatImportButtonLabel(count: number): string {
  if (count === 0) {
    return 'Import subscriptions';
  }

  return `Import ${pluralize(count, 'subscription', 'subscriptions')}`;
}

export function canImport(count: number): boolean {
  return count > 0 && count <= MAX_IMPORT_ITEMS;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** The success toast, e.g. "Imported 13 subscriptions · 2 new categories". */
export function formatImportResult(result: { subscriptionsImported: number; categoriesCreated: number }): string {
  const imported = `Imported ${pluralize(result.subscriptionsImported, 'subscription', 'subscriptions')}`;

  if (result.categoriesCreated === 0) {
    return imported;
  }

  return `${imported} · ${pluralize(result.categoriesCreated, 'new category', 'new categories')}`;
}
