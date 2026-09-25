# Move Subscriptions Requirements

## Status

Approved for implementation.

## Purpose

Moving lets users reorganize subscriptions across their collections without recreating them. It enables users to:

- Move one subscription from its row actions menu.
- Move several selected subscriptions at once from the table toolbar.
- Keep each subscription's categorization when it lands in another collection.

A move changes where a subscription lives going forward. It must not rewrite recorded invoice history.

## Terminology

- **Source collection:** The collection a subscription belongs to before the move.
- **Target collection:** The collection the user selects as the destination.
- **Created category:** A category the move inserted into the target collection because no category with a matching name existed there.

## Scope

The feature moves existing subscriptions between the authenticated user's collections. It does not copy subscriptions, and it does not create collections.

Moving is the only way to change a subscription's collection. The subscription update operation must not accept a collection change.

## Entry points

### Row actions menu

The row actions menu must contain a **Move to** submenu in this order:

1. Edit
2. Move to ▸
3. Deactivate or Reactivate
4. Separator
5. Delete

### Table toolbar

When one or more rows are selected, the selection toolbar must contain a **Move to** outline button that opens a dropdown of target collections. It appears before the Deactivate or Reactivate button.

Both entry points are available in the Active and Inactive views.

Both entry points use `FolderInputIcon` and the existing `MenuActionItem` and button treatments.

The subscription edit form must not expose a collection field.

### Target list

- The target list contains every collection the user owns except the current collection, ordered by name.
- The list is read from the cached collections query used by the collection switcher.
- Selecting a collection performs the move immediately. There is no confirmation step.

### Single-collection state

When the user owns only one collection, there is no valid target.

- The row actions menu must render **Move to** as a disabled menu item rather than a submenu trigger, without a submenu chevron.
- The toolbar must render **Move to** as a disabled button.
- Both must show the tooltip **Create another collection to move subscriptions.**
- The tooltip must open on hover and on keyboard focus.

Interaction details:

- The disabled menu item is composed as the tooltip trigger's rendered element. It must restore pointer events on the disabled item so hover reaches the tooltip trigger. Base UI keeps disabled menu items keyboard-focusable and ignores their activation.
- The disabled toolbar button must use `focusableWhenDisabled` so it remains focusable and hoverable. The shared button component must style `aria-disabled` with reduced opacity and a not-allowed cursor. It must not apply `pointer-events-none` to `aria-disabled`, because that would block the tooltip.
- Tooltip placement uses the default side with collision handling. If it covers adjacent menu items awkwardly, use `side="left"`.

## Move behavior

### Eligibility

- Active and inactive subscriptions can be moved.
- All subscriptions in one move go to the same target collection.
- A subscription that is already in the target collection cannot be moved there.

### Preserved fields

A move changes only `collectionId` and `categoryId`. It must preserve:

- Name and icon
- Cost amount and frequency
- `nextInvoiceDate`
- Status and `deactivatedAt`

### Category handling

Categories are collection-scoped, so a subscription's category cannot follow it into the target collection by ID. The move must carry the category over by name:

- Uncategorized subscriptions remain Uncategorized.
- A categorized subscription is assigned the target collection's category with the same name, compared case-insensitively.
- When the target collection has no matching category, the move creates one using the source category's exact name and casing.
- Subscriptions that share a source category share one target category. A move must not create duplicate categories.
- After a move, a subscription must never reference a category that belongs to a different collection.

### Duplicate subscription names

A target collection may already contain a subscription with the same name. The move must allow this without warning.

### Invoices

- Recorded invoices keep their snapshotted `collectionId` and remain in the source collection's invoice history.
- Invoices recorded after the move belong to the target collection.
- Projected upcoming invoices follow the subscription immediately because they are derived from the collection's active subscriptions.

This preserves the invoice requirement that recorded snapshots are never rewritten.

## Feedback

### Success

The user stays on the current collection. Moved rows leave the current table, and the row selection is cleared.

A success toast names the target collection:

- Single: **Moved “Netflix” to Personal**
- Bulk: **Moved 3 subscriptions to Personal**

Moves cannot be undone. To reverse a move, the user moves the subscriptions back. Categories the move created remain in the target collection.

### Pending state

The toolbar **Move to** button must be disabled while a move is pending.

### Errors

- A failed move shows **Failed to move. Refresh and try again.**
- A failed move leaves the row selection intact.
- A failed move changes nothing. Moves are all-or-nothing.

Moves fail when:

- Any selected subscription no longer exists or is already in the target collection.
- The target collection no longer exists or is not owned by the user.

## Data requirements

### Move operation

A single bulk server function replaces the existing single-subscription `moveSubscription`. Row actions call it with one subscription ID.

Input:

- `subscriptionIds`: the existing unique subscription ID list schema, from 1 to 500 distinct IDs
- `collectionId`: the target collection

The operation must run in one transaction that:

1. Asserts the target collection belongs to the authenticated user.
2. Selects the subscriptions by user and ID with their current category names, locking the subscription rows `FOR UPDATE`.
3. Rejects the move with `UserFacingError('Subscriptions changed. Refresh and try again.')` when any subscription is missing or already in the target collection.
4. Resolves target categories through the shared category helper.
5. Updates each subscription's `collectionId` and `categoryId`.
6. Returns the updated subscriptions.

The server function must use `requireAuthMiddleware` and `withUserFacingErrors`.

Subscriptions in one request are not required to share a source collection.

### Category resolution helper

A shared helper, `findOrCreateCategoriesByName(tx, { userId, collectionId, names })`, must run inside the caller's transaction and:

1. Deduplicate names case-insensitively, keeping the first casing seen.
2. Select existing categories in the collection by `lower(name)` in one query.
3. Insert missing categories with `onConflictDoNothing()` and `returning()`.
4. Re-select any names whose insert lost a race with a concurrent insert.
5. Return a case-insensitive name-to-category-ID mapping.

Import and seed must use this helper in place of their local `resolveCategoryId` closures. That consolidation is a separate commit from the move feature.

Name normalization and deduplication must be pure functions.

### Update operation

`collectionId` must be removed from the subscription update input schema and from `updateMySubscription`. This closes the path where a collection change could leave a category from another collection.

### Concurrency

- Moves lock subscription rows so concurrent moves, lifecycle changes, and the due-invoice job serialize against them.
- When the due-invoice job holds a subscription lock first, the invoice snapshots the source collection and the move waits.
- When the move commits first, the job snapshots the target collection and category.

### Query caching

After a successful move, the client must invalidate:

- `['subscriptions','list']`, covering both collections, every status, and every client-derived dashboard, projected-invoice, and sidebar value.
- `['categories','list', targetCollectionId]`, because the move may create categories there.

Collection and recorded-invoice queries are unaffected and must not be invalidated.

Moves do not use optimistic updates.

## Accessibility

- The **Move to** submenu, its collection items, and the toolbar dropdown must be fully keyboard operable using the existing menu primitives.
- Disabled **Move to** controls must remain keyboard-focusable and expose their disabled state through `aria-disabled`.
- The single-collection tooltip must be reachable by keyboard focus, not only by hover.

## Non-goals

The first implementation does not include:

- Copying subscriptions to another collection
- Creating a collection from the move menu
- Choosing or mapping target categories manually
- Changing a subscription's collection from the edit form
- Moving recorded invoice history
- Partial moves that succeed for some subscriptions and fail for others
- Undoing a move from the success toast
- Searching the target collection list
- Database-backed integration tests

## Acceptance criteria

The implementation is complete when:

1. Row actions and the selection toolbar offer **Move to** with every other collection ordered by name.
2. Selecting a target moves the subscriptions immediately in one all-or-nothing transaction.
3. Active and inactive subscriptions can be moved, and all fields other than collection and category are preserved.
4. Categories carry over by case-insensitive name, and missing categories are created once in the target collection.
5. No subscription references a category from another collection after a move or update.
6. Recorded invoices remain in the source collection's history.
7. Success toasts name the target collection. They do not offer Undo.
8. Users with one collection see disabled **Move to** controls with a hover- and focus-accessible tooltip.
9. The subscription update operation no longer accepts `collectionId`.
10. Import and seed use the shared category resolution helper.
11. Subscription and target category queries refresh after moves.
12. Name normalization and deduplication are covered by unit tests.
