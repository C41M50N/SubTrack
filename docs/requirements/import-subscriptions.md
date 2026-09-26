# Import Subscriptions Requirements

## Status

Approved for implementation.

## Purpose

Importing lets users add many subscriptions to a collection at once instead of entering them one by one. It enables users to:

- Re-import a SubTrack JSON or CSV export into a collection.
- Upload bank statements, receipts, or screenshots and have AI find the subscriptions in them.
- Review everything before it is saved, choosing exactly which subscriptions to import and fixing any that are wrong.

Both entry points lead to the same review step and the same import operation. Nothing is written to the database until the user confirms the import.

## Terminology

- **Target collection:** The collection the import writes to.
- **File import:** An import from a SubTrack JSON or CSV export file.
- **Smart import:** An import from PDFs or images, parsed by an AI agent.
- **Review step:** The step where the user selects, deselects, and edits rows before importing.
- **Row group:** One of three sections in the review step: **Ready**, **Needs review**, or **Needs fixes**.
- **Pending category:** A category name proposed by the AI or created while editing a review row. It exists only in the dialog until the import commits.
- **Descriptor:** The raw merchant text from a statement line, such as `PADDLE.NET* SETAPP`.

## Scope

Imports always target a single existing collection. Imports do not create collections.

The `collection` field in export files is ignored. Every row goes to the target collection. Restoring a multi-collection backup is a separate feature.

All amounts are USD. Imports do not convert currencies.

Mobile layouts are not supported.

## Entry points

### Collection options menu

The collection options menu must contain an **Import subscriptions** item next to the **Export** submenu. The target collection is the collection whose menu was opened.

### Empty collection state

When a collection has no subscriptions, the subscriptions table's empty state must offer an **Import subscriptions** button alongside its message. The target collection is the current collection.

### Import dialog

Both entry points open the same wide dialog. The dialog title names the target collection. The dialog has two steps: upload, then review.

## Upload step

### Drop zone

The upload step has a single drop zone that also opens a file picker. The file type decides the import path:

| Files                                     | Path         |
| ----------------------------------------- | ------------ |
| One `.json` or `.csv` file                | File import  |
| One to five PDF, PNG, JPEG, or WebP files | Smart import |

Export files cannot be combined with other files. Selecting a mix must show an error and must not start either path.

HEIC files are rejected with **HEIC isn't supported. Export the image as JPEG or PNG.**

### File limits

File import:

- One file, at most 5 MB.

Smart import:

- At most 5 files.
- At most 10 MB per file.
- At most 20 pages in total. Each image counts as one page.

Limits are checked on the client for immediate feedback and again on the server. The server must reject oversized requests before reading the full body into memory where the runtime allows it.

Files rejected by these checks never reach the AI provider and never count toward usage limits.

### Disclosure

The upload step must show: **Files are sent to OpenAI to extract subscriptions and aren't stored.**

### Availability

Smart import is disabled when:

- `OPENAI_API_KEY` is not configured. The drop zone accepts only export files and shows the tooltip **Smart import isn't configured.**
- The user has reached a usage limit. See [Usage limits](#usage-limits).

File import is always available.

## File import

### Parsing

Export files are parsed on the client with `parseSubscriptionImport`. The parser must return valid rows and invalid rows with their errors instead of throwing on the first invalid row.

The whole file is rejected, and the dialog stays on the upload step, only when:

- The JSON is malformed.
- The JSON envelope is not a SubTrack subscriptions export.
- The CSV is missing required columns.

### Row handling

- Valid rows go to **Ready**.
- Invalid rows go to **Needs fixes** and show their first validation error.
- An empty `category` means Uncategorized. The parser must map it to `null` instead of failing. This fixes the round trip for exports that contain uncategorized subscriptions.
- A category name that doesn't exist in the target collection becomes a pending category.
- `status` and `deactivatedAt` are preserved. Inactive rows show an **Inactive** badge.

## Smart import

### Agent

Smart import is a single agent run through `@cbuff/ai`:

| Setting   | Value                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| Provider  | OpenAI, direct through `@ai-sdk/openai`                                                                      |
| Model     | `gpt-6-sol`                                                                                                  |
| Reasoning | `medium`                                                                                                     |
| Tools     | `openai.tools.webSearch({ searchContextSize: 'low', userLocation: { type: 'approximate', country: 'US' } })` |
| Output    | `Output.object` with the schema below                                                                        |
| Timeout   | 5 minutes total                                                                                              |

The agent has no custom tools. Web search runs inside the provider call, so the run completes in one step.

The run receives:

- The uploaded files as file parts.
- The target collection's existing category names.
- Today's date.

### Instructions

The agent must be instructed to:

- Search the web only with merchant names or descriptors. It must never search with account numbers, card numbers, statement numbers, names, addresses, or amounts paired with personal details.
- Search only when a descriptor is ambiguous or the billing frequency can't be read from the files. Well-known merchants need no search.
- Merge repeated charges from the same merchant across files into one item. Use the most recent charge date and amount, and describe the pattern in the reason, such as **Charged 3× monthly**. When the amount changed, note the change in the reason.
- Keep separate items for different recurring amounts at the same merchant in the same period, such as two plans.
- Prefer existing category names. Propose a new name only when none fits.
- Put items with guessed frequency, non-USD charges, or uncertain merchant identity in the low-confidence list.

### Output schema

The output has two lists: `highConfidence` and `lowConfidence`. Together they hold at most 150 items.

Each item has:

| Field            | Type                                           | Notes                                           |
| ---------------- | ---------------------------------------------- | ----------------------------------------------- |
| `descriptor`     | string                                         | Raw statement text                              |
| `name`           | string                                         | Interpreted merchant or service name            |
| `domain`         | string, nullable                               | Used as `iconRef`. `null` when unknown          |
| `amountCents`    | integer                                        | Most recent charge                              |
| `currency`       | string                                         | ISO 4217 code                                   |
| `frequency`      | `weekly`, `monthly`, `yearly`, or `biennially` | Best guess. Required                            |
| `lastChargeDate` | ISO date                                       | Most recent charge                              |
| `category`       | string                                         | Existing or proposed category name              |
| `reason`         | string                                         | One line explaining the item and its confidence |

OpenAI strict schemas do not support optional properties. Fields that can be missing must be nullable.

### Post-processing

The server converts agent output into review rows:

1. `nextInvoiceDate` is computed from `lastChargeDate` and `frequency` by rolling forward to the first date on or after today. The agent never does date arithmetic.
2. Non-USD items are forced into **Needs review** with the reason **Charged in EUR. Amount not converted.** Their amount is kept unconverted.
3. Items that fail the subscription schema, including a `null` domain, go to **Needs fixes**. A missing domain shows **Pick an icon**.
4. Remaining high-confidence items go to **Ready**. Remaining low-confidence items go to **Needs review**.
5. Category names not in the target collection become pending categories.

All smart import rows are active.

### Waiting state

While the agent runs, the dialog shows one indeterminate state with the copy **Reading your files and looking up merchants. This can take a minute or two.** and a **Cancel** button. It does not show staged progress.

### Failures

| Outcome                      | Behavior                                                                                                | Counts as a success |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------- |
| Run fails or times out       | Error message with **Retry**. Files stay attached                                                       | No                  |
| Run succeeds with zero items | Stay on the upload step with **We couldn't find any subscriptions in these files.** Files stay attached | Yes                 |
| User cancels                 | The run is aborted and the dialog returns to the upload step                                            | No                  |

Every run counts as an attempt. See [Usage limits](#usage-limits).

## Review step

### Row groups

The review step shows one table with up to three labeled groups:

| Group            | Contents                                    | Default selection | Selectable |
| ---------------- | ------------------------------------------- | ----------------- | ---------- |
| **Ready**        | High-confidence AI rows and valid file rows | Selected          | Yes        |
| **Needs review** | Low-confidence AI rows                      | Not selected      | Yes        |
| **Needs fixes**  | Rows that fail validation                   | Not selected      | No         |

Empty groups are hidden. File import only produces **Ready** and **Needs fixes**.

Groups reflect row status, not selection. Deselecting a **Ready** row keeps it in **Ready**.

The header checkbox selects or clears every selectable row. Each group header also has its own select-all checkbox.

### Editing

Each row has an **Edit** action that opens the subscription form prefilled with the row, in a review mode:

- Saving validates with the existing subscription form rules.
- Saving an edit counts as the user verifying the row. The row moves to **Ready** and becomes selected. This applies to rows from **Needs review** and **Needs fixes**.
- The table keeps its scroll position and briefly highlights the moved row in its new position.
- Review mode never writes to the database.

### Pending categories

- The category combobox in review mode lists the target collection's categories plus every pending category in the dialog.
- Creating a category while editing a row adds a pending category. It becomes available to every review row.
- Pending categories are created when the import commits. Cancelling leaves no categories behind.
- Rows with a pending category show a **New category** badge.

### Duplicate detection

A row is a likely duplicate when a subscription in the target collection, active or inactive, has the same name, compared case-insensitively, or the same `iconRef`.

Likely duplicates show an **Already in collection** badge and start deselected, regardless of group. The user can still select them.

### Columns

1. Selection checkbox
2. Icon
3. Name. AI rows show the reason and the descriptor underneath, with the descriptor in small muted monospace.
4. Cost and frequency
5. Next invoice date
6. Category
7. Badges: **Already in collection**, **New category**, **Inactive**, or the validation error
8. Edit action

### Footer

The footer shows the selection count, the selection's monthly total from `effectiveMonthlyCents`, and the actions:

`13 selected · +$142.30/mo` **Cancel** **Import 13 subscriptions**

- The import button uses the singular for one row: **Import 1 subscription**.
- The import button is disabled when nothing is selected or while the import is pending.

### Cancel and close

- Cancelling or closing during the review step asks **Discard this import?** only when the user has edited a row or changed the selection. Otherwise the dialog closes immediately.
- Closing during a smart import run aborts the run.

## Import operation

A single `importSubscriptions` server function replaces the current content-string version. Both paths call it with reviewed rows.

Input:

- `collectionId`: the target collection
- `items`: 1 to 150 subscriptions, each with name, `iconRef`, category name or `null`, cost amount, frequency, `nextInvoiceDate`, status, and `deactivatedAt`

The operation must run in one transaction that:

1. Validates every item again with zod. The client is never trusted.
2. Asserts the target collection belongs to the authenticated user.
3. Resolves category names through `findOrCreateCategoriesByName`, creating pending categories.
4. Inserts all subscriptions in one statement.
5. Returns the number of subscriptions imported and categories created.

Imports are all-or-nothing. The server function must use `requireAuthMiddleware` and `withUserFacingErrors`.

### Feedback

On success, the dialog closes and a toast reports the result:

- **Imported 13 subscriptions**
- **Imported 13 subscriptions · 2 new categories**

Imported rows are not highlighted in the table.

On failure, the dialog stays open on the review step with its selection intact and shows **Failed to import. Try again.**

### Query caching

After a successful import, the client must invalidate:

- `['subscriptions','list']`
- `['categories','list', collectionId]`

## Smart import operation

A `smartImport` POST server function accepts `FormData` with the `collectionId` and files. It must:

1. Require authentication and assert collection ownership.
2. Validate file count, types, sizes, and total page count.
3. Enforce usage limits.
4. Record the run in `ai_usage`.
5. Run the agent and post-process its output into review rows.
6. Update the usage row with the outcome and metadata.

Files are held in memory for the request only. They are never stored or logged. Only timing and cost are logged.

## Usage limits

Smart import has two limits per user over a rolling 24 hours:

| Limit     | Counts                         | Message                                                                                               |
| --------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Successes | 5 runs with status `succeeded` | **2 smart imports left today** when 2 or fewer remain, then **Smart import is available again in 3h** |
| Attempts  | 15 runs of any status          | **Too many attempts. Try again in 3h.** Shown only when reached                                       |

Both limits are skipped when `import.meta.env.DEV` is true on the server.

A run's status starts as `started` and is updated to `succeeded`, `failed`, or `cancelled` when it ends. A run left in `started` by a crash still counts as an attempt.

## Data requirements

### `ai_usage` table

| Column        | Type                  | Notes                                         |
| ------------- | --------------------- | --------------------------------------------- |
| `id`          | text                  | Primary key                                   |
| `userId`      | text                  | References the user. Cascades on delete       |
| `feature`     | enum                  | `smart_import`                                |
| `status`      | enum                  | `started`, `succeeded`, `failed`, `cancelled` |
| `createdAt`   | timestamptz           | Run start                                     |
| `completedAt` | timestamptz, nullable | Run end                                       |
| `metadata`    | jsonb                 | Typed per feature with `.$type<>()`           |

The limit queries need an index on `(userId, feature, createdAt)`.

Smart import metadata contains the model ID, input and output tokens, cost in USD, duration, file count, page count, item count, and error message when the run failed.

Migrations are generated only with explicit approval.

### Environment

`.env.schema` gains `OPENAI_API_KEY` as `@required=false @sensitive @type=string`.

### Dependencies

- `@cbuff/ai`
- `ai` v7
- `@ai-sdk/openai`
- A PDF library for counting pages on the server

## Privacy

- Uploaded files are processed in memory and never stored.
- File contents and agent output are never logged.
- Web searches contain only merchant names and descriptors.

## Accessibility

- The drop zone must be keyboard operable and open the file picker on Enter and Space.
- Row and group checkboxes must expose checked, unchecked, and indeterminate states.
- Disabled **Needs fixes** checkboxes must expose their disabled state.
- The waiting state must announce progress to assistive technology.

## Testing

Unit tests must cover:

- `nextInvoiceDate` roll-forward for every frequency
- The parser's split into valid and invalid rows, including empty categories
- Group assignment, default selection, and moving rows after an edit
- The import count and button label
- Duplicate detection
- Usage limit counting

Manual evaluation uses a gitignored `fixtures/private/` folder and a script that runs the real agent on private statements and prints grouped results and cost.

One synthetic statement PDF is committed for demos and upload-flow testing.

The agent run is not covered by automated tests.

## To verify during implementation

- GPT-6 Sol accepts PDF input through the Responses API. The gateway lists PDF support, but OpenAI's model page lists only text and image.
- TanStack Start propagates client aborts to the server handler. If it doesn't, the usage row must record the run's actual outcome.
- The hosting platform allows requests of at least 5 minutes.
- Whether the AI SDK exposes OpenAI's `max_tool_calls` to cap web searches.
- Whether a server-level request body size limit can be set through a custom server entry.

## Non-goals

The first implementation does not include:

- Restoring exports across multiple collections
- Creating collections from an import
- Currency conversion
- HEIC support
- Staged progress or streaming during smart import
- A logo.dev tool for the agent
- AI Gateway routing
- Storing uploaded files
- Merging imports into existing subscriptions
- Highlighting imported rows
- Mobile layouts
- Usage limits on file import

## Acceptance criteria

The implementation is complete when:

1. The collection options menu and the empty collection state open the import dialog for the right collection.
2. One drop zone routes export files to file import and PDFs or images to smart import, and rejects mixed or oversized selections.
3. File import handles malformed rows without rejecting the file, and uncategorized exports round-trip.
4. Smart import runs one GPT-6 Sol agent with web search and returns grouped rows with reasons and descriptors.
5. The review step shows **Ready**, **Needs review**, and **Needs fixes** with the specified default selections.
6. Editing a row validates it, moves it to **Ready**, and selects it.
7. Pending categories are shared across rows and created only on import.
8. Likely duplicates are flagged and deselected.
9. The footer shows the selection count, monthly total, and **Import N subscriptions**.
10. Importing writes all selected rows in one transaction and shows a result toast.
11. Smart import is disabled without an API key and enforces the success and attempt limits outside development.
12. Every smart import run is recorded in `ai_usage` with its outcome and metadata.
13. Uploaded files are never stored or logged.
