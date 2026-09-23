# Invoices Page Requirements

## Status

Approved for implementation.

## Purpose

The Invoices page is the collection-scoped billing timeline for SubTrack. It enables users to:

- Understand which subscription invoices have already been recorded.
- See which subscription invoices are expected next.
- Inspect billing activity by month and by day.
- Understand the total financial impact of invoices in the active period.

The page must distinguish recorded invoice history from projected upcoming invoices. It must not imply that SubTrack has confirmed whether an invoice was paid.

## Terminology

- **Recorded invoice:** An immutable invoice snapshot created when a subscription reaches its scheduled invoice date.
- **Upcoming invoice:** A projected occurrence calculated from an active subscription's next invoice date and billing frequency. An upcoming invoice is not persisted as an invoice record.
- **Active period:** The calendar month displayed by the invoice calendar and represented by the `month` route search parameter.
- **Selected day:** The date selected in the calendar. It controls the day agenda but does not narrow the invoice table.

The interface must use **Upcoming**, **Recorded**, **Expected**, and **Invoice history** where appropriate. It must not describe recorded invoices as **Paid**.

## Route and navigation state

The page remains at:

`/c/:collectionId/invoices`

The route must use validated search parameters for:

- `view`: `upcoming` or `history`
- `month`: a calendar month formatted as `yyyy-MM`

The default view is `upcoming`. The default month is the current calendar month in the user's local time zone.

Default search parameter values may be omitted from the URL. Invalid values must resolve to the defaults without breaking the route.

Changing the view or calendar month must update the route search parameters. Browser back and forward navigation must restore the corresponding view and month. Search text, category filters, table sorting, and selected day remain local component state.

## Page layout

The page must follow the established visual language and layout conventions of the Subscriptions page:

- A flex-column page shell with `1.5rem` page padding and section gaps.
- The existing heading typeface, card treatment, radii, borders, shadows, spacing, and muted text treatment.
- A three-column summary-card row on supported widths.
- A two-thirds/one-third main-content layout on desktop.
- Existing table, card, button, badge, tooltip, scroll-area, icon, and calendar primitives.

The page contains these sections in order:

1. Page header
2. Invoice summary cards
3. Main invoice workspace

### Page header

The header must contain:

- Title: **Invoices**
- Description: **Review recorded charges and see what is coming up.**

The header must not contain an Add invoice action. Invoices are produced automatically from subscription schedules.

### Invoice summary cards

Three stable summary cards must remain anchored to the current date. They must not change when the user changes the active view, active period, selected day, search text, category filters, or table sorting.

#### Recorded this month

- Displays the sum of recorded invoices whose invoice dates fall within the current calendar month.
- Displays the number of recorded invoices as supporting text.
- Uses zero rather than an em dash when there are no recorded invoices.

#### Due in 30 days

- Displays the sum of projected invoice occurrences in the rolling 30-day window beginning today.
- Displays the number of projected invoices as supporting text.
- Counts each recurrence separately. A weekly subscription that bills four times contributes four invoices and four charges to the total.
- Uses zero rather than an em dash when nothing is due.

#### Next invoice

- Displays the amount, subscription identity, and relative date of the earliest projected invoice.
- Uses the existing subscription icon treatment.
- Displays an em dash and **Nothing scheduled** when no active subscription has an upcoming invoice.
- Breaks same-date ties by displaying the larger charge.

### Main invoice workspace

The main workspace must use:

- A table region spanning two columns of a three-column desktop grid.
- A calendar card spanning the remaining column.

The table and calendar must describe the same active view and active period.

## Active view control

A segmented `Upcoming | History` control must appear above the table.

- **Upcoming** represents projected invoices for active subscriptions.
- **History** represents persisted invoice snapshots.
- Changing the active view must preserve the active period.
- Changing the active view must reset search text, category filters, table sorting, and the selected day to the defaults for the new view.
- The active option must be visually and programmatically identifiable.

## Invoice table

The table must reuse the established Subscriptions table construction and visual treatment, including:

- Sticky header
- Scrollable body at constrained desktop heights
- Sortable column headers
- Subscription icons
- Category badges
- Tabular numerals for currency
- A toolbar above the table
- A summary footer below the table

The table must not include selection checkboxes, bulk actions, row-action menus, edit actions, or delete actions. Recorded invoices are immutable, and upcoming invoices are projections rather than persisted records.

### Upcoming columns

The Upcoming table must contain:

1. Subscription
2. Category
3. Amount
4. Frequency
5. Expected date

The default sort is expected date ascending. Same-date invoices must use amount descending and subscription name ascending as deterministic tie-breakers.

The amount column displays the charge for one invoice occurrence, not an effective monthly cost.

### History columns

The History table must contain:

1. Subscription
2. Category
3. Amount
4. Invoice date

The default sort is invoice date descending. Same-date invoices must use amount descending and subscription name ascending as deterministic tie-breakers.

History rows must render their snapshotted name, icon reference, category, and amount. They must continue to render after the source subscription is renamed, recategorized, changed, deactivated, or deleted.

### Table toolbar

The toolbar must contain:

- Search by subscription name
- Category filter

Search and category filters operate on the invoices in the active view and active period. Search is case-insensitive and matches the displayed subscription name.

The category filter options must be derived from the active result set. Historical category values are invoice snapshots and must not be rewritten to match current category names.

### Table footer

The footer must summarize the filtered table result using:

- Invoice count
- Total amount
- Active month

Example:

> 8 upcoming invoices · $143.72 in August

The noun and supporting language must reflect the active view. The footer must include a Reset action whenever search, category filtering, or non-default sorting is active.

Reset restores:

- Empty search text
- No category filtering
- The active view's default sorting

Reset does not change the active view or active period.

## Calendar card

The calendar card must be an invoice-specific extension of the existing calendar primitive. It must not behave as a generic date picker.

The card header must identify the active view:

- **Upcoming schedule** in Upcoming view
- **Invoice history** in History view

Supporting text must explain that the calendar represents the active month.

### Month navigation

- The calendar displays one month.
- Previous and next controls change the active period and update the `month` route search parameter.
- History navigation has no artificial past limit.
- Upcoming navigation is constrained to the rolling 12-month projection horizon beginning with the current month.
- The interface must prevent navigation beyond the upcoming projection horizon.

### Invoice markers

- Every date containing at least one invoice in the active result set must have a visible marker.
- A date containing multiple invoices must display the invoice count.
- Upcoming markers and recorded-history markers must use distinct treatments that remain legible in light and dark themes.
- The accessible name or description for a marked date must include the date, invoice count, and total amount.
- Marker meaning must not depend on color alone.

### Selected-day behavior

Selecting a date updates the day agenda beneath the calendar. It must not filter the table.

When the active period changes:

- The selected day defaults to today when the active period is the current month.
- Otherwise, it defaults to the earliest invoice date in that month.
- When the month contains no invoices, it defaults to the first day of the month.

When the active view changes, the selected day is recalculated using the same rules.

### Day agenda

The agenda must display:

- The selected date
- Invoice count and total amount for that date
- One row per invoice
- Subscription icon and name
- Invoice amount

Upcoming agenda rows may include the billing frequency. History agenda rows must not infer or display a frequency because frequency is not part of the recorded invoice snapshot.

When the selected date contains no invoices, the agenda must display a concise view-specific empty message.

## Data requirements

### Collection scope

Every recorded invoice request must be authorized by the authenticated user and scoped to the active collection.

Recorded invoice snapshots must retain their `collectionId` after the source subscription is deleted. Deleting a collection deletes its invoice history.

### Recorded history access

Recorded history must be queried by:

- Authenticated user
- Collection
- Inclusive start date
- Exclusive end date

The page must request only the active month's history rather than loading the user's complete invoice history.

The server query must sort recorded invoices by invoice date descending and apply deterministic tie-breakers.

The invoice schema must provide an index that supports filtering recorded invoices by user, collection, and invoice date.

### Upcoming projection

Upcoming invoices must be calculated from active subscriptions in the current collection.

Projection must:

- Begin on each subscription's stored `nextInvoiceDate`.
- Advance according to the stored billing frequency.
- Generate separate occurrences for repeated charges.
- Cover a rolling 12-month horizon.
- Exclude inactive and deleted subscriptions.
- Preserve date-only semantics and avoid time-zone shifts.

Projection logic must live in a shared, pure domain utility. Summary metrics, the table, the calendar, and tests must use the same projection rules.

### Presentation model

Recorded invoices and upcoming projections must remain distinct domain types.

A shared presentation model may be created at the UI boundary to support common table and calendar rendering. The presentation model must retain an explicit `kind` discriminator so recorded and projected data cannot be confused.

Upcoming projections must never be inserted into the invoice table merely to render the page.

### Query caching

Query keys must include every server-side input that changes the result, including collection and date range.

Changing months must reuse cached month results when available. Route loading must prefetch the data required by the validated active view and active period.

The page's data dependencies are:

- Active subscriptions for the current collection, used for upcoming projections and upcoming summary metrics.
- Recorded invoices for the current calendar month, used by the stable **Recorded this month** summary card.
- Recorded invoices for the active period when History is active and the active period differs from the current month.

The current-month history request must be shared between the summary card and History workspace when both require the same date range. The page must not issue duplicate requests for an identical query key.

## States and feedback

### Empty states

The table must provide view-specific empty states:

- Upcoming with no active subscriptions: explain that adding an active subscription creates a schedule and link to the collection's Subscriptions page.
- Upcoming with active subscriptions but no invoices in the active month: state that no invoices are expected in the selected month.
- History with no recorded invoices in the active month: state that no invoices were recorded in the selected month.
- Filtered result with no matches: state that no invoices match the current filters and provide a Reset action.

The calendar agenda must use shorter equivalents of these messages where applicable.

### Loading

Route-level data must be prefetched through the router and TanStack Query integration.

Transitions between uncached months must preserve the page shell and show localized loading feedback in the table and calendar content. The page must not replace the entire layout with a blank loading screen.

### Errors

A failed recorded-history request must produce a recoverable inline error state with a Retry action.

A failure in one data region must not remove unrelated data that loaded successfully.

## Responsive behavior

### Desktop

- Summary cards appear in three columns.
- The table and calendar use a two-thirds/one-third grid.
- The table body and calendar agenda may scroll independently when the viewport meets the established `roomy` breakpoint.

### Tablet

- Summary cards may remain in multiple columns when space permits.
- The table and calendar stack when the three-column workspace no longer fits without compression.

### Mobile

- Summary cards stack vertically.
- The calendar appears before the table so month navigation remains the primary period control.
- The active view control remains visible without horizontal scrolling.
- The table may scroll horizontally, but the subscription name and amount must remain easy to identify.
- Touch targets must meet the existing component-library sizing conventions.

## Accessibility

- The page must support keyboard navigation through the view control, calendar, toolbar, sortable headers, table, and agenda.
- The active view must expose its selected state programmatically.
- Calendar dates with invoices must expose invoice count and total amount to assistive technology.
- Table sort state must be announced through the appropriate `aria-sort` value.
- Currency values must include an accessible currency interpretation.
- Focus indicators must use existing focus-ring conventions and remain visible in both themes.
- Empty, loading, and error states must be communicated as text and must not rely on icons or color alone.
- Motion, if introduced, must respect `prefers-reduced-motion`.

## Non-goals

The first implementation does not include:

- Manual invoice creation
- Invoice editing or deletion
- Payment confirmation
- Paid, unpaid, overdue, failed, or refunded statuses
- Transaction or bank synchronization
- Receipt or attachment management
- Invoice export
- Infinite future forecasting
- Cross-collection invoice aggregation

## Acceptance criteria

The implementation is complete when:

1. The page defaults to Upcoming and the current month.
2. View and month are represented by validated route search parameters.
3. The three summary cards report current, unfiltered collection-level metrics.
4. Upcoming invoices are projected for active subscriptions across a rolling 12-month horizon.
5. History requests are collection-scoped and limited to the active month.
6. Recorded and upcoming invoices remain distinct domain types.
7. The table switches columns and default sorting correctly between Upcoming and History.
8. The table supports local name search and category filtering without row selection or mutation actions.
9. The footer reports the filtered invoice count, amount, and active month.
10. Calendar month navigation updates the route and table.
11. Calendar markers communicate invoice count and total amount accessibly.
12. Selecting a calendar day updates the agenda without narrowing the table.
13. Recorded history continues to render from snapshots after source subscription changes or deletion.
14. Empty, loading, and error states are view-specific and recoverable where applicable.
15. The page conforms to the established SubTrack visual system and responsive layout conventions.
16. Projection, aggregation, date-boundary, sorting, and route-search behavior are covered by automated tests.
