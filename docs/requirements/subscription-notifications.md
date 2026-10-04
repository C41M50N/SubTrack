# Subscription Notifications Requirements

## Status

Draft for review.

## Purpose

Notifications help users notice upcoming subscription charges and review their recent and future billing schedule without opening EverySub. Users choose which collections send notifications, where those notifications go, and which subscriptions may appear in them.

EverySub tracks expected billing. A notification must not imply that a charge was paid, that a provider will renew on the exact date shown, or that EverySub can cancel a subscription.

## Terminology

- **Renewal reminder:** A notification about an active subscription's next expected charge, sent a chosen number of calendar days before its expected date.
- **Monthly overview:** A notification containing the previous month's recorded scheduled invoices and the new month's expected schedule. The new month can contain recorded due-date snapshots alongside future projections.
- **Destination:** A user-owned delivery endpoint: the verified account email, a generic webhook, or a Discord webhook.
- **Route:** A collection's explicit choice to send renewal reminders or monthly overviews to a destination.
- **Included subscription:** A subscription whose details may appear in outbound notifications. This is independent of its active or inactive status and of collection routing.
- **Recorded invoice:** A persisted snapshot created from a subscription's schedule when its expected invoice date becomes due. It is not a payment confirmation.
- **Projected invoice:** A future occurrence calculated from an active subscription's current schedule. It is not a recorded invoice.

## Scope and ownership

- Notification timing and destinations belong to the authenticated user.
- Each collection independently selects destinations for renewal reminders and monthly overviews. There are no account-wide route defaults or inherited collection settings.
- A destination may be reused by several collections. A collection may route either notification type to several destinations.
- A subscription's inclusion choice controls all outbound notifications, regardless of destination or notification type.
- All routes start disabled. Creating a destination does not start delivery; a collection must explicitly select it.
- New collections start with no routes. New subscriptions are included by default, but cannot produce outbound notifications until their collection has a route.
- The user may choose any combination of email, Discord, and generic webhook delivery, including none.

## User-level timing

- The user chooses an IANA time zone. Initial setup suggests the browser's time zone and lets the user change it.
- All scheduled notifications target **9 a.m. in the user's chosen time zone**. The interface displays the time zone alongside the send time.
- The renewal lead time is one user-level setting: an integer from **1 through 6 calendar days**, defaulting to **3 days**. It applies to every collection and destination.
- Date-only subscription schedules must be interpreted as calendar dates in the user's chosen time zone. Daylight saving transitions must not shift a reminder or monthly overview to the wrong local date.
- A change to time zone or lead time affects future scheduling. It must not create a duplicate notification for an occurrence already reminded about or trigger an immediate catch-up for a reminder date that is already past.

## Renewal reminders

### Eligibility

A subscription is eligible for a reminder when all of the following are true at delivery time:

1. It is active and belongs to the authenticated user's collection.
2. Its next expected invoice date is in the future in the user's time zone.
3. It is included in notifications.
4. Its collection routes renewal reminders to the destination.
5. The occurrence has not already produced a successful reminder for that destination.

The normal reminder date is the expected invoice date minus the user's lead time in calendar days. Weekly subscriptions can produce a reminder for each weekly occurrence. Reminders use the current subscription schedule and expected amount, not recorded invoice history.

### Grouping and content

- Create at most one logical renewal-reminder event per destination for each local reminder date. Group all eligible subscriptions from collections routed to that destination.
- Use the collection as each group's header and list its subscriptions beneath it.
- Each item shows the subscription name, expected invoice date, and expected charge amount in USD.
- The message identifies dates and amounts as expected. It must not include a subscription deep link or a cancellation action.
- Excluded subscriptions contribute neither rows nor amounts. If no eligible items remain, do not send the message.

### Changes and missed sends

- Creating a subscription, changing its expected invoice date, or enabling a route after the normal reminder date has passed does not trigger an immediate reminder for that occurrence.
- If a changed date has a future normal reminder date, the reminder may be sent on that new date. Changing only a name or amount does not create a second reminder for an occurrence already reminded about.
- If a scheduled run is missed because EverySub is unavailable, send the overdue reminder when service resumes **only while its expected invoice date is still in the future**. This outage recovery does not override the no-catch-up rule for user-created, edited, or newly routed occurrences.
- Never send a reminder on or after its expected invoice date. Once delivery succeeds, a rerun or retry must not initiate another send for the same destination and occurrence.
- Deactivating or deleting a subscription stops future reminders. Reactivation uses the resumed future schedule.

## Monthly overview

### Schedule and scope

- Send on the **first day of each month at 9 a.m.** in the user's chosen time zone.
- For each destination, create at most one overview containing only collections that route monthly overviews to it at delivery time.
- The previous-month section covers the complete previous local calendar month. The new-month section covers the local calendar month beginning on the scheduled send date. For example, an overview scheduled for October 1 covers recorded September invoices and October's expected schedule, including when delivery occurs later in the first week.
- If the scheduled run is missed, send the overview during local calendar days **1 through 7**, labeling the months it covers. Do not send it after day 7.
- Enabling a route after its scheduled send does not replay that month's overview. The outage recovery window applies to a previously scheduled overview, not to a newly enabled route.
- Skip the overview when both sections contain no included occurrences for the collections routed to that destination.

### Previous month: recorded schedule

- Use recorded invoice snapshots whose invoice dates fall within the previous month. Do not reconstruct this section from the subscriptions' current schedules.
- Show an invoice recorded before a subscription was later deactivated, moved, renamed, or deleted. An invoice is absent if the subscription was deactivated before its due date and no invoice was recorded.
- Preserve the collection recorded on the invoice. Moving a subscription to another collection must not reroute that historical invoice through its new collection.
- Render the recorded name, icon, category, amount, and date from the invoice snapshot rather than current subscription data.
- Respect the subscription's **current** inclusion choice until deletion; after deletion, respect its preserved final inclusion choice. An exclusion made after the invoice was recorded applies to the overview and its subtotal.
- A deleted subscription's recorded invoice remains eligible when it was included before deletion. Its live subscription record is not required to render the snapshot. Deleting the collection removes its invoice history under the existing collection-deletion behavior.
- Label the section as recorded scheduled charges, never as confirmed payments or actual spending.

### New month: expected schedule

- Include recorded invoice snapshots whose dates have become due during the new month, and project later occurrences from active subscriptions' current schedules through that month's end. This keeps charges due on the first, and charges due before a late delivery, in the month's expected schedule.
- Do not show the same invoice occurrence twice. A weekly subscription may contribute several distinct occurrences.
- Recorded items use their snapshotted collection, name, amount, date, and preserved inclusion choice. Projected items use the active subscription's current collection, name, expected amount, and inclusion choice.
- Exclude inactive or deleted subscriptions from future projections, and exclude notification-excluded subscriptions and invoices from both sources.
- Label the section as the new month's expected schedule. Identify which items are already recorded scheduled invoices and which remain projections; neither is a confirmed payment.

### Presentation

- Group each section by collection. Within each collection, list occurrence dates, subscription names, and amounts.
- Show an occurrence count and USD subtotal for each section and collection. Counts are invoice occurrences, not unique subscription counts.
- Show a concise empty state for one section when the other section contains items.
- Do not present the difference between adjacent months as an increase or decrease in ongoing commitments; different billing frequencies can make that comparison misleading.
- Include no subscription deep links or cancellation actions.

## Subscription inclusion and privacy

- **Include in notifications** is on by default for a newly created or imported subscription. The setting is visible in the create/edit subscription form.
- Collection settings provide a list of subscriptions in that collection with quick inclusion switches. Active and inactive subscriptions with recorded history must remain manageable there.
- When a collection first selects a destination for either notification type, the setup flow presents that collection's subscriptions for review before saving the route. Adding a different destination repeats the review. Selecting the second notification type for a previously reviewed collection-destination pair need not repeat it.
- Turning inclusion off removes the subscription from all future outbound reminder and overview rows, counts, and totals. It applies to previously recorded invoices that have not yet been sent in an overview.
- The chosen inclusion state must survive subscription deletion so a deleted subscription's historical snapshots follow its final choice. A deleted subscription cannot be re-enabled for outbound notification through a live subscription control.
- Inclusion and route changes take effect for deliveries that have not succeeded, including pending retries. Before each attempt, rebuild or revalidate the payload against the latest inclusion, route, and destination state; cancel the delivery if nothing eligible remains.
- EverySub cannot recall content an external destination already accepted. The interface must not imply that turning off notifications removes previously delivered messages.
- Subscription details, destination secrets, and full webhook URLs must not appear in routine logs or failure messages.

## Destination management and collection routing

### User-level destinations

- Account-level notification settings manage the user's time zone, reminder lead time, and destinations.
- Each destination has a user-facing name, type, enabled/paused status, and delivery health. Generic and Discord destinations may be created more than once.
- **Email** refers only to the user's current verified account email. Additional recipient addresses are outside this scope. Email delivery pauses while a changed account address awaits verification, and resumes at the new verified address.
- A **generic webhook** is a public HTTPS URL. It receives a structured, versioned JSON event and a verifiable signature generated with a per-destination signing secret. The user can rotate that secret.
- A **Discord webhook** uses Discord-compatible message formatting. Its URL is treated as a secret.
- Webhook URL validation and delivery must prevent requests to private, loopback, or otherwise unsafe network destinations, including through redirects.
- A user can send a sample-data test to a generic or Discord destination before routing live notifications. The sample is clearly labeled as a test and contains no real subscription details.
- Deleting a destination shows the collections and notification types that currently route to it, then removes all those routes. No further notifications go to the deleted destination.

### Collection settings

- Each collection independently selects zero or more destinations for reminders and zero or more for monthly overviews.
- The settings show both the destination routes and the subscription inclusion list for that collection.
- The selected routes are explicit on/off choices. There is no inherit state, universal default route, or automatic copying of routes to a new collection.
- Removing a route stops that collection's details from all future sends to that destination, including a pending overview of last month's recorded invoices.
- A destination shared by several collections receives one grouped reminder for a given day and one grouped overview for a given month. A collection not routed to it contributes no data.

## Generic webhook contract

- Deliver separate event types for a grouped renewal reminder and a monthly overview. The payload identifies its schema version, event type, stable event ID, destination, scheduled local date, time zone, and included collections and items.
- Reminder items include stable subscription and collection IDs, names, expected dates, and expected amounts in cents with currency `USD`.
- Previous-month items include invoice IDs, recorded collection IDs, snapshot details, invoice dates, and amounts. A deleted subscription may have no live subscription ID.
- New-month items include their source (`recorded` or `projected`), stable collection and item IDs, dates, and expected amounts. Recorded items use invoice IDs and may have no live subscription ID; projected items use subscription IDs.
- The payload contains no excluded rows, metadata about excluded subscriptions, or totals that include them.
- Repeated attempts for the same logical destination event retain the same event ID. Receivers must be able to deduplicate because a timeout can occur after a receiver accepted the request; delivery during retries is at least once, not exactly once.
- Each request carries a signature and timestamp so a receiver can verify the sender and reject replayed requests. Secret rotation must not silently break an active destination.
- Discord receives a readable message derived from the same eligible data, not the generic JSON contract.

## Delivery reliability and feedback

- A transient network failure, rate limit, or temporary server rejection receives up to **four retries after the initial attempt**, with increasing delays and jitter over roughly one hour. Honor a destination's `Retry-After` instruction when applicable.
- A clear permanent rejection pauses the affected destination promptly. Temporary failures exhaust retries for the current event; pause the destination after three consecutive events that exhaust their retries, and reset that count after a successful delivery. Other destinations continue independently.
- A paused destination does not accumulate a bulk replay. Re-enabling it resumes future notifications; a still-relevant missed reminder or monthly overview may be sent only under the catch-up rules above.
- Show the destination's latest success or failure and actionable paused state in account settings. A prominent account-level alert identifies destinations needing attention.
- Do not silently fall back to email or another destination when delivery fails. Do not send subscription details to an unselected route.
- A destination test reports success or a useful failure without exposing its secret URL or real subscription data.
- The invoice-processing job and notification delivery must agree on user-local calendar dates. The notification system must not require one invoice cron job per user. Before sending an overview, ensure its previous-month recorded invoice data is complete for the intended date range.
- Persist enough scheduling and delivery state to avoid intentionally resending an event after confirmed success across job reruns, restarts, and retries. An uncertain webhook result may still lead to duplicate external delivery, which receivers can identify by event ID.

## Accessibility and responsive behavior

- Destination forms, route controls, test actions, and inclusion switches must be keyboard operable and have programmatic names and states.
- Setup must explain when a route starts delivery and which subscriptions may be included before the user saves it.
- Paused destinations, delivery errors, test results, and empty states must be communicated in text rather than color or icons alone.
- Collection and account settings must remain usable on narrow screens without hiding route or privacy state.

## Non-goals

The first implementation does not include:

- An in-app notification inbox or read/unread state
- Push notifications, SMS, or additional email recipient addresses
- Account-wide default routes or per-collection inheritance
- Per-subscription reminder lead times or multiple reminders for one occurrence
- Subscription-provider cancellation or payment confirmation
- A comparison claiming that month-to-month invoice totals measure a change in ongoing commitments
- Automatic delivery fallback to an unselected destination
- Bulk replay of notifications missed while a destination was paused

## Acceptance criteria

The implementation is complete when:

1. A user can choose a time zone and a 1–6 day reminder lead, with defaults of the browser's suggested time zone and 3 days.
2. A user can create and test multiple generic and Discord destinations, and use only the verified account email for email delivery.
3. Each collection explicitly routes reminders and overviews to selected destinations, with no routes selected for a new collection.
4. The first selection of a destination in a collection presents that collection's subscription inclusion choices for review.
5. A subscription's inclusion choice is available in its form and collection settings, applies to all outbound content and totals, and survives deletion for recorded history.
6. At 9 a.m. local time, a destination receives at most one grouped reminder for eligible renewals on a day, and no reminder for a due or past-due charge.
7. A late addition, schedule edit, or newly enabled route inside the lead window creates no immediate reminder; an outage can catch up an already scheduled reminder while the charge is still future.
8. A destination receives at most one overview per month for its routed collections, with recorded previous-month invoices and the new month's recorded and projected occurrences clearly distinguished.
9. The overview includes recorded invoices from subscriptions later deactivated or deleted when allowed by their preserved inclusion choice; moved subscriptions retain their historical collection attribution.
10. Empty overviews are skipped, and a missed overview is sent only through local day 7 of that month.
11. Changes to inclusion, routes, or destinations prevent ineligible details from being sent on pending attempts or retries.
12. Generic webhooks provide a versioned, signed, itemized payload with stable event and entity IDs; Discord receives readable messages; tests use only sample data.
13. Temporary delivery failures retry with backoff, permanent failures pause the destination, and failure status is visible without leaking secrets or using an unselected fallback.
14. Job reruns and retries do not resend after confirmed success; webhook consumers have a stable event ID for deduplication when acceptance is uncertain.
15. Automated tests cover lead-time boundaries, weekly recurrence, local month boundaries and daylight saving, collection routing and moves, deletion and privacy history, catch-up and duplicate prevention, payload filtering, and delivery failure behavior.
