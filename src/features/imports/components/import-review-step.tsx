import { CircleAlertIcon, PencilIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  dedupeCategoryNames,
  toCategoryNameKey,
} from '@/features/categories/names';
import {
  addPendingCategory,
  applyRowEdit,
  buildDuplicateIndex,
  canImport,
  type DuplicateIndex,
  formatImportButtonLabel,
  getSelectedItems,
  groupReviewRows,
  isLikelyDuplicate,
  isNewCategory,
  isSelectable,
  type ReviewContext,
  reviewGroupLabels,
  type ReviewRow,
  type ReviewState,
  setRowsSelected,
  summarizeSelection,
} from '@/features/imports/review';
import type { CategoryOption } from '@/features/subscriptions/components/category-combobox';
import {
  SubscriptionFormDialog,
  type SubscriptionFormPrefill,
  type SubscriptionFormReviewMode,
  type SubscriptionFormValues,
} from '@/features/subscriptions/components/subscription-form-dialog';
import { SubscriptionIcon } from '@/features/subscriptions/components/subscription-icon';
import {
  formatCurrencyFromCents,
  frequencyUnit,
} from '@/features/subscriptions/cost';
import {
  formatInvoiceDate,
  formatInvoiceDistance,
} from '@/features/subscriptions/format';
import {
  type ImportSubscriptionItem,
  importSubscriptionItemSchema,
  MAX_IMPORT_ITEMS,
} from '@/features/subscriptions/schema';
import { cn } from '@/lib/utils';

const HIGHLIGHT_DURATION_MS = 1600;

const groupHints = {
  ready: null,
  needs_review: 'Check these before selecting them.',
  needs_fixes: 'Edit a row to fix it.',
} as const;

type EditSession = {
  rowId: string;
  prefill: SubscriptionFormPrefill;
  status: ReviewRow['draft']['status'];
};

type ImportReviewStepProps = {
  collectionId: string;
  review: ReviewState;
  onReviewChange: (update: (state: ReviewState) => ReviewState) => void;
  context: ReviewContext;
  isImporting: boolean;
  importFailed: boolean;
  onCancel: () => void;
  onImport: (items: ImportSubscriptionItem[]) => void;
};

export function ImportReviewStep({
  collectionId,
  review,
  onReviewChange,
  context,
  isImporting,
  importFailed,
  onCancel,
  onImport,
}: ImportReviewStepProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [editSession, setEditSession] = useState<EditSession | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  useEffect(() => {
    if (highlightedRowId === null) {
      return;
    }

    const timeout = window.setTimeout(
      () => setHighlightedRowId(null),
      HIGHLIGHT_DURATION_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [highlightedRowId]);

  const duplicateIndex = useMemo(
    () => buildDuplicateIndex(context.subscriptions),
    [context.subscriptions],
  );
  const sections = groupReviewRows(review.rows);
  const selectableRows = review.rows.filter(isSelectable);
  const selectedItems = getSelectedItems(review);
  const summary = summarizeSelection(selectedItems);
  const overLimit = summary.count > MAX_IMPORT_ITEMS;

  // Review rows refer to categories by name, so the form's category options
  // use the name key as their ID.
  const categoryOptions = useMemo<CategoryOption[]>(
    () =>
      dedupeCategoryNames([
        ...context.categories,
        ...review.pendingCategories,
      ]).map((name) => ({ id: toCategoryNameKey(name), name })),
    [context.categories, review.pendingCategories],
  );

  function setSelected(rows: ReviewRow[], selected: boolean) {
    onReviewChange((state) =>
      setRowsSelected(
        state,
        rows.map((row) => row.id),
        selected,
      ),
    );
  }

  function handleEdit(row: ReviewRow) {
    setEditSession({
      rowId: row.id,
      status: row.draft.status,
      prefill: {
        name: row.draft.name,
        iconRef: row.draft.iconRef,
        categoryId: row.draft.category
          ? toCategoryNameKey(row.draft.category)
          : null,
        costAmount: row.draft.costAmount,
        costFrequency: row.draft.costFrequency,
        nextInvoiceDate: row.draft.nextInvoiceDate,
      },
    });
    setEditOpen(true);
  }

  function handleSave(session: EditSession, values: SubscriptionFormValues) {
    const row = review.rows.find((candidate) => candidate.id === session.rowId);

    if (!row) {
      return null;
    }

    const category = values.categoryId
      ? (categoryOptions.find((option) => option.id === values.categoryId)
          ?.name ?? null)
      : null;
    const result = importSubscriptionItemSchema.safeParse({
      ...values,
      category,
      status: row.draft.status,
      deactivatedAt: row.draft.deactivatedAt,
    });

    if (!result.success) {
      return result.error;
    }

    onReviewChange((state) =>
      applyRowEdit(state, row.id, result.data, context.categories),
    );
    setHighlightedRowId(row.id);

    return null;
  }

  function handleCreateCategory(name: string) {
    const result = importSubscriptionItemSchema.shape.category.safeParse(name);

    if (!result.success || result.data === null) {
      return {
        error: result.error?.issues[0]?.message ?? 'Category is required',
      };
    }

    const category = result.data;

    onReviewChange((state) =>
      addPendingCategory(state, category, context.categories),
    );

    return { id: toCategoryNameKey(category) };
  }

  const reviewMode: SubscriptionFormReviewMode | undefined = editSession
    ? {
        prefill: editSession.prefill,
        status: editSession.status,
        onCreateCategory: handleCreateCategory,
        onSave: (values) => handleSave(editSession, values),
      }
    : undefined;

  const allSelected =
    selectableRows.length > 0 &&
    selectableRows.every((row) => review.selectedIds.has(row.id));
  const someSelected = selectableRows.some((row) =>
    review.selectedIds.has(row.id),
  );

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col px-6">
        <ScrollArea
          ref={tableRef}
          className="min-h-0 flex-1 rounded-xl ring-1 ring-foreground/10"
        >
          <Table containerClassName="overflow-visible">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <ColumnHead className="w-10 pl-3">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    disabled={selectableRows.length === 0}
                    onCheckedChange={(checked) =>
                      setSelected(selectableRows, checked === true)
                    }
                    aria-label="Select all subscriptions"
                  />
                </ColumnHead>
                <ColumnHead>
                  <span className="sr-only">Icon</span>
                </ColumnHead>
                <ColumnHead>Name</ColumnHead>
                <ColumnHead>Cost</ColumnHead>
                <ColumnHead>Next invoice</ColumnHead>
                <ColumnHead>Category</ColumnHead>
                <ColumnHead>
                  <span className="sr-only">Status</span>
                </ColumnHead>
                <ColumnHead className="w-12 pr-4">
                  <span className="sr-only">Actions</span>
                </ColumnHead>
              </TableRow>
            </TableHeader>
            {sections.map((section) => (
              <ReviewGroupBody
                key={section.group}
                group={section.group}
                rows={section.rows}
                selectedIds={review.selectedIds}
                duplicateIndex={duplicateIndex}
                existingCategories={context.categories}
                highlightedRowId={highlightedRowId}
                onSelect={setSelected}
                onEdit={handleEdit}
              />
            ))}
          </Table>
        </ScrollArea>
      </div>

      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 flex-col gap-0.5 text-sm">
          <p className="text-muted-foreground tabular-nums">
            <span className="font-medium text-foreground">
              {summary.count} selected
            </span>{' '}
            · +{formatCurrencyFromCents(summary.monthlyCents)}
            {frequencyUnit('monthly')}
          </p>
          {overLimit ? (
            <p className="text-destructive">
              Import up to {MAX_IMPORT_ITEMS} subscriptions at a time.
            </p>
          ) : importFailed ? (
            <p role="alert" className="text-destructive">
              Failed to import. Try again.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={() => onImport(selectedItems)}
            disabled={!canImport(summary.count) || isImporting}
          >
            {isImporting
              ? 'Importing…'
              : formatImportButtonLabel(summary.count)}
          </Button>
        </div>
      </div>

      <SubscriptionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collectionId={collectionId}
        review={reviewMode}
        categories={categoryOptions}
        finalFocus={() => {
          // The edited row may have moved groups, so focus its Edit button in
          // the new position without scrolling the table.
          const button = tableRef.current?.querySelector<HTMLElement>(
            `[data-edit-row="${editSession?.rowId}"]`,
          );
          button?.focus({ preventScroll: true });

          return false;
        }}
      />
    </>
  );
}

// Column headers stay visible while the table scrolls.
function ColumnHead({
  className,
  ...props
}: React.ComponentProps<typeof TableHead>) {
  return (
    <TableHead
      className={cn(
        'sticky top-0 z-10 bg-popover px-3 shadow-[inset_0_-1px_0_var(--border)]',
        className,
      )}
      {...props}
    />
  );
}

type ReviewGroupBodyProps = {
  group: ReviewRow['group'];
  rows: ReviewRow[];
  selectedIds: ReadonlySet<string>;
  duplicateIndex: DuplicateIndex;
  existingCategories: string[];
  highlightedRowId: string | null;
  onSelect: (rows: ReviewRow[], selected: boolean) => void;
  onEdit: (row: ReviewRow) => void;
};

function ReviewGroupBody({
  group,
  rows,
  selectedIds,
  duplicateIndex,
  existingCategories,
  highlightedRowId,
  onSelect,
  onEdit,
}: ReviewGroupBodyProps) {
  const label = reviewGroupLabels[group];
  const hint = groupHints[group];
  const selectableRows = rows.filter(isSelectable);
  const selectedCount = selectableRows.filter((row) =>
    selectedIds.has(row.id),
  ).length;
  const allSelected =
    selectableRows.length > 0 && selectedCount === selectableRows.length;

  return (
    <TableBody>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableCell className="py-2 pl-3">
          <Checkbox
            checked={allSelected}
            indeterminate={selectedCount > 0 && !allSelected}
            disabled={selectableRows.length === 0}
            onCheckedChange={(checked) =>
              onSelect(selectableRows, checked === true)
            }
            aria-label={`Select all in ${label}`}
          />
        </TableCell>
        <TableHead scope="rowgroup" colSpan={7} className="h-9 px-3">
          <span className="flex items-baseline gap-2">
            <span>{label}</span>
            <span className="font-normal text-muted-foreground tabular-nums">
              {rows.length}
            </span>
            {hint && (
              <span className="font-normal text-muted-foreground">{hint}</span>
            )}
          </span>
        </TableHead>
      </TableRow>
      {rows.map((row) => (
        <ReviewTableRow
          key={row.id}
          row={row}
          selected={selectedIds.has(row.id)}
          duplicate={isLikelyDuplicate(row.draft, duplicateIndex)}
          newCategory={isNewCategory(row.draft.category, existingCategories)}
          highlighted={row.id === highlightedRowId}
          onSelect={onSelect}
          onEdit={onEdit}
        />
      ))}
    </TableBody>
  );
}

type ReviewTableRowProps = {
  row: ReviewRow;
  selected: boolean;
  duplicate: boolean;
  newCategory: boolean;
  highlighted: boolean;
  onSelect: (rows: ReviewRow[], selected: boolean) => void;
  onEdit: (row: ReviewRow) => void;
};

function ReviewTableRow({
  row,
  selected,
  duplicate,
  newCategory,
  highlighted,
  onSelect,
  onEdit,
}: ReviewTableRowProps) {
  const { draft } = row;
  const displayName = draft.name || 'Unnamed subscription';

  return (
    <TableRow
      data-state={selected ? 'selected' : undefined}
      className={cn(highlighted && 'motion-safe:animate-row-highlight')}
    >
      <TableCell className="py-2.5 pl-3 align-top">
        <Checkbox
          className="mt-2"
          checked={selected}
          disabled={!isSelectable(row)}
          onCheckedChange={(checked) => onSelect([row], checked === true)}
          aria-label={`Select ${displayName}`}
        />
      </TableCell>
      <TableCell className="px-3 py-2.5 align-top">
        <SubscriptionIcon
          domain={draft.iconRef}
          name={draft.name || '?'}
          size="md"
        />
      </TableCell>
      <TableCell className="w-full min-w-56 px-3 py-2.5 align-top whitespace-normal">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span
            className={cn(
              'leading-8 font-medium',
              !draft.name && 'text-muted-foreground',
            )}
          >
            {displayName}
          </span>
          {row.reason && (
            <span className="text-xs text-pretty text-muted-foreground">
              {row.reason}
            </span>
          )}
          {row.descriptor && (
            <span className="font-mono text-[11px] break-all text-muted-foreground/80">
              {row.descriptor}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="px-3 py-2.5 align-top leading-8">
        {draft.costAmount === null ? (
          <MissingValue />
        ) : (
          <span className="font-medium tabular-nums">
            {formatCurrencyFromCents(draft.costAmount)}
            {draft.costFrequency && (
              <span className="text-xs font-normal text-muted-foreground">
                {frequencyUnit(draft.costFrequency)}
              </span>
            )}
          </span>
        )}
      </TableCell>
      <TableCell className="px-3 py-2.5 align-top">
        {draft.nextInvoiceDate === null ? (
          <span className="leading-8">
            <MissingValue />
          </span>
        ) : (
          <div className="flex flex-col">
            <span className="tabular-nums">
              {formatInvoiceDate(draft.nextInvoiceDate)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatInvoiceDistance(draft.nextInvoiceDate)}
            </span>
          </div>
        )}
      </TableCell>
      <TableCell className="px-3 py-2.5 align-top leading-8">
        {draft.category ? (
          <Badge variant="secondary">{draft.category}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Uncategorized</span>
        )}
      </TableCell>
      <TableCell className="px-3 py-2.5 align-top">
        <div className="flex min-h-8 max-w-48 flex-wrap content-center items-center gap-1">
          {row.error && (
            <Badge variant="destructive">
              <CircleAlertIcon aria-hidden />
              {row.error}
            </Badge>
          )}
          {duplicate && <Badge variant="outline">Already in collection</Badge>}
          {newCategory && <Badge variant="outline">New category</Badge>}
          {draft.status === 'inactive' && (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="py-2.5 pr-4 align-top">
        <Button
          variant="ghost"
          size="icon-sm"
          data-edit-row={row.id}
          aria-label={`Edit ${displayName}`}
          onClick={() => onEdit(row)}
        >
          <PencilIcon />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function MissingValue() {
  return (
    <span className="text-muted-foreground" aria-label="Missing">
      —
    </span>
  );
}
