# Onboarding Requirements

## Status

Requirements agreed. Implementation has not been authorized and must wait for an explicit instruction.

## Purpose

Help a new user start tracking real subscriptions without first having to understand collections or configure reminders. The first useful result is a saved subscription with its spending and renewal information available on the dashboard.

Import is the primary invitation because it can give users a useful spending picture with less manual entry. Manual entry remains clearly available for users who do not have a file handy or do not want to upload one.

## Scope

- New accounts and existing accounts with no collections, including the production account that currently lands on the unactionable **No collections yet** screen.
- Automatic initial collection creation, starter categories, and time zone capture.
- Dashboard onboarding using the existing import and manual-entry flows.
- A one-time reminder invitation and guidance through the existing reminder settings.
- Prevention of last-collection deletion.
- USD only. No currency selection or conversion is introduced.

Established users who already have subscriptions must not be put through onboarding or receive the new reminder invitation.

## Related requirements

- [Import subscriptions](import-subscriptions.md) defines upload, extraction, review, validation, usage limits, privacy disclosure, and commit behavior.
- [Subscription notifications](subscription-notifications.md) defines scheduling, destinations, collection routing, subscription inclusion, and delivery behavior.

This spec adds onboarding entry points and guidance. It does not replace those features' existing rules. Import is primary within dashboard onboarding; the existing subscriptions page header does not need to change its action hierarchy.

## Initial account setup

### Default collection

- An account without collections receives a collection named **Personal** automatically.
- Users do not have to name a collection or complete a collection-creation step before tracking subscriptions.
- Existing collections and subscriptions are preserved. Setup must not add a redundant Personal collection to an account that already has a collection.
- Initial setup must be safe to repeat after a refresh, retry, or concurrent visit without creating duplicate collections or categories.
- Personal behaves like any other collection: users can rename it and create additional collections.
- Successful setup lands the user on the collection dashboard with normal app navigation and collection controls available.
- Setup failures must provide visible feedback and a way to retry rather than leave users at a dead end.

### Starter categories

Every newly created collection, including the initial Personal collection, receives these starter categories:

1. Entertainment
2. Productivity
3. Health
4. Finance
5. Education
6. Utilities
7. Miscellaneous

These are ordinary, collection-owned categories that users can rename, delete, or supplement. They are initial defaults, not an enforced taxonomy. Returning to the app must not recreate categories a user has deliberately removed or renamed.

Existing collections are not retroactively seeded as part of onboarding. Duplication continues to preserve the source collection's categories rather than altering its organization.

### Category requirements

Preserve existing behavior rather than introduce onboarding-specific validation:

- Manual subscription entry requires a category.
- Imports can save uncategorized subscriptions.
- Editing an import review row uses the existing subscription form rules.
- Imports can match existing categories and create pending categories under the existing import requirements.

### Time zone

- Capture the browser's time zone as the initial account default without adding an onboarding step.
- Use the saved account time zone for renewal processing independently of whether reminders are configured.
- Make it editable in account settings and visible during reminder setup.
- Preserve an existing saved preference. Subsequent visits or a different browser must not silently overwrite it.
- If a valid browser time zone cannot be detected, retain the existing fallback behavior and allow correction in settings without blocking subscription entry.
- Capturing a time zone does not select a destination, enable a collection route, or imply that reminders are working.

## Dashboard onboarding

### Presentation and actions

- Show onboarding within the actual collection dashboard, with normal app navigation available.
- Do not introduce a dedicated welcome page or a required setup wizard.
- Importing is the primary action: a drop zone whose **Choose files** button, or files dropped on it, start the existing importer with those files.
- Adding by hand is the secondary path and must be clearly visible: a short list of popular services that opens the existing subscription form with the name, icon, and matching starter category filled in, a search that also offers any typed name, and an **Add something else by hand** action.
- Quick-add never fills in a price. Users enter what they actually pay.
- All actions use the current collection and open the existing workflows.
- Below the actions, a preview of the dashboard's metrics fills in as subscriptions are saved.
- There is no **Skip for now** action: skipping would expose the same available actions.
- Users can navigate elsewhere without completing onboarding.

### Import invitation

- Explain that users can import subscriptions from PDFs or screenshots of statements or receipts, or from an EverySub export.
- Do not imply that arbitrary bank CSV files are supported. CSV import expects EverySub's export format.
- Keep the existing upload disclosure, review step, validation, file limits, usage limits, and cancellation behavior.
- Do not add bank linking, pasted-text input, or new supported file formats.
- Files dropped on the dashboard upload right away, so the drop zone shows the existing smart import disclosure itself.
- If smart import is unavailable, manual entry remains available and the existing importer communicates its availability accurately.

### Completion and returning visits

- Dashboard visits open in onboarding until the account successfully saves its first subscription.
- A successful manual creation or committed import containing at least one subscription completes this milestone.
- Uploading a file, extracting candidates, or reviewing rows does not complete it.
- Cancelled imports, failed saves, and imports with no saved subscriptions leave onboarding available.
- Returning before the first successful save shows onboarding again.
- After the first save, onboarding stays up for the rest of that visit so users can keep adding, with saved services confirmed in place. **See your dashboard** leaves it, and a committed import leaves it once the import dialog closes. Leaving the page or reloading after the first save opens the regular dashboard.
- Completion applies to the account, not separately to every collection.
- Once completed, onboarding does not restart when users remove subscriptions or create another collection. Ordinary empty states must continue to provide actionable import and manual-entry controls.

## First successful save

- Show the saved subscriptions' spending and renewal information right away in the onboarding preview, and the populated dashboard once onboarding hands over to it.
- A multi-subscription import completes onboarding once and produces one reminder invitation, not one per imported subscription.
- Do not require users to inventory all their subscriptions before using the app.
- Spending totals represent the subscriptions currently tracked; the interface must not imply that onboarding establishes a complete inventory of the user's spending.

## One-time reminder invitation

After the first successful save, once the user reaches the regular dashboard, show a one-time **Set up reminders** invitation at the top of it. When the collection has a charge in the upcoming list, the invitation names it. It has two actions:

| Action               | Behavior                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| **Set up reminders** | Go to account notification settings and begin the guided handoff to collection reminder settings. |
| **Not now**          | Remove the invitation and leave the user on the dashboard.                                        |

- Leaving or reloading the page while it shows counts as skipping.
- Do not show it during onboarding, where it would interrupt someone still adding subscriptions.
- Show the invitation only once per account, regardless of collection, refresh, later sign-in, or device.
- Taking either action or leaving must not cause it to reappear on later visits.
- Reminder settings remain accessible through normal navigation after skipping.
- Suppress the invitation for established users and when the onboarding collection already has a working reminder configuration.
- Tracking subscriptions does not require accepting the invitation or enabling reminders.
- Do not add a recurring reminder-setup card or repeatedly prompt users who have skipped.

## Guided reminder setup

Reuse the existing settings screens rather than introduce a separate reminder wizard.

1. **Account notification settings** at `/settings/notifications`: review the time zone, configure the reminder schedule, and add or select a destination.
2. Provide clear guidance and a **Continue to collection reminders** action that leads to `/c/$collectionId/settings` for the collection that triggered onboarding.
3. **Collection notification settings**: enable renewal reminders for the chosen destination and confirm the subscription inclusion review required by the existing notification flow.

- Preserve collection context through the handoff. Users must not have to discover the second settings page themselves.
- Account notification settings alone do not complete reminder setup. Make the remaining collection-routing step clear.
- A working reminder configuration requires a configured schedule, an available and unpaused destination, and an enabled renewal-reminder route for the relevant collection. Actual subscription eligibility and delivery follow the existing notification requirements.
- A destination labeled **Ready** is not sufficient evidence that reminder setup is complete; it may have no collection routes.
- Do not automatically route subscription data to a destination, bypass inclusion review, enable monthly overviews, or promise an immediate reminder.
- Notification status and copy must distinguish subscriptions being tracked from reminders being configured.

## Last-collection deletion

- A user must not be able to delete their final collection.
- Keep the deletion action available. An attempted last-collection deletion shows an error toast explaining that the last collection cannot be deleted.
- Rejection preserves the collection and all its subscriptions, categories, invoices, and related data.
- Enforce this rule for the deletion operation, not only in the visible controls. Stale state or concurrent requests must not allow all of a user's collections to be deleted.
- Deleting a collection remains available when another collection will remain.
- Do not silently recreate Personal after a deletion attempt.

## State and interaction requirements

- Account-level setup, first-save completion, and reminder-invitation history must survive refreshes and later sign-ins.
- Failed initial setup or subscription saves must not mark onboarding complete or consume the reminder invitation. A failed reminder-setup operation does not reopen an invitation the user has already acted on.
- Keyboard users must be able to reach every onboarding action and both reminder invitation actions. The invitation must have an accessible title. When it's dismissed, or when onboarding hands over to the dashboard, focus moves to the page heading.
- Loading, unavailable, and error states must communicate what happened and preserve a usable next action.

## Non-goals

- Synthetic subscriptions, portfolio demo data, or a separate demo experience.
- Paid-product onboarding or automatically adding EverySub as a subscription. That idea is reserved for a future paid version.
- Currency preferences, multiple currencies, or conversion.
- Mandatory profile setup, collection naming, notification setup, or a product tour.
- Changes to subscription category validation solely for onboarding.
- New import formats or changes to extraction and review behavior.
- A replacement notification system or a separate reminder wizard.

## Acceptance criteria

1. A new account and an existing account with no collections receive one Personal collection and reach a dashboard with normal navigation and usable onboarding actions.
2. Existing collections and subscription data are preserved, and repeated or concurrent initial setup does not create duplicates.
3. Each newly created collection receives the seven agreed starter categories; user changes are not undone on later visits.
4. Manual entry, import, and import review retain their existing category rules.
5. The browser's time zone is captured without a setup step, can be changed in settings, and does not overwrite an existing preference or imply reminders are enabled.
6. Dashboard onboarding makes import primary and adding by hand clearly available, with no skip action or navigation gate.
7. Import copy accurately describes supported sources and retains the existing upload disclosure and review-before-save behavior, including for files dropped on the dashboard.
8. Onboarding remains after cancellation, extraction without a commit, an empty result, or a failed save; the first successful manual save or import completes it. It stays up for the rest of that visit until the user moves on or an import commits.
9. Completion survives subsequent visits and does not restart for another collection or after removing subscriptions.
10. The first success fills in the onboarding preview, and leaving onboarding presents the populated dashboard with, when eligible, one reminder invitation for the account.
11. Setting up, skipping, or leaving the reminder invitation prevents repeat invitations; established users and already configured users are excluded.
12. Reminder setup guides users from account schedule and destination settings into the relevant collection's routing and inclusion controls.
13. A destination without an enabled collection reminder route is not treated as completed reminder setup.
14. Attempting to delete the final collection shows an error toast and changes no data, including when requests use stale state or overlap.
15. The experience contains no synthetic data, currency setup, required reminders, or automatic EverySub subscription.

## Implementation constraints

- This document records requirements only; implementation still requires explicit authorization.
- Do not run `db:generate` without a separate explicit instruction, as required by the repository's development instructions.
