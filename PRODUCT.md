# EverySub Product

## Product definition

> **Mission:** Make subscription spending and renewal schedules easy to understand and act on.

EverySub is a subscription management SaaS for individuals. It keeps subscription costs, upcoming renewals, and recorded billing history in view so people can understand recurring commitments without reconstructing them from bank statements, email, and memory.

## Problem and outcome

Subscriptions are easy to start and easy to lose track of. Charges arrive on different schedules, and annual or biennial plans obscure their monthly impact. A list of services alone does not answer what is due soon, what the recurring total is, or how that total changes over time.

EverySub should help a user answer three questions quickly: **What am I committed to? What is coming up? How much does it add up to?** The intended outcome is a more accurate understanding of recurring spending and fewer unexpected renewals. A subscription count or time spent in the app is not a success measure by itself.

## Product model

- **Subscriptions are the source of the schedule.** Each active subscription has a price, billing frequency, next invoice date, and optional category and icon. Users can deactivate or reactivate it without erasing its history.
- **Collections organize subscriptions.** Users create collections and move subscriptions between them. Each collection has its own dashboard, categories, and invoice view. Collections are a way for an individual to organize subscriptions, not a shared account model.
- **Normalized cost explains the big picture.** Weekly, monthly, yearly, and biennial prices are expressed as effective monthly and yearly costs in USD. These figures make mixed billing schedules comparable; they are not a bank balance or cash-flow guarantee.
- **Projected and recorded invoices mean different things.** Upcoming invoices are projections from the current subscription schedule. Recorded invoices are snapshots made as scheduled dates become due, preserving the expected amount and date at that time. Neither is proof that a payment succeeded.
- **Imports accelerate setup, with review.** Users can import EverySub JSON or CSV exports. When configured, smart import can find subscription candidates in PDF statements, receipts, and screenshots. The user reviews and selects candidates before they are saved.
- **Exports keep the data portable.** Users can export subscriptions for one collection or all collections as JSON or CSV. Import places all rows into a chosen collection, even when the export includes collection names.
- **Renewal awareness is user controlled.** Upcoming renewals are visible in the app. Timely reminders are a product direction, with the user choosing whether and when to receive them.
- **Cancellation decisions belong to the user.** EverySub can surface signals such as an approaching renewal or a rising cost without claiming to know whether a subscription is worth keeping.

## Decision principles

When product goals compete, prefer:

1. Clear spending and renewal information over more activity in the app.
2. Honest labels and uncertainty over implying that a projection or scheduled invoice is a confirmed charge.
3. User review and control over automatically adding inferred subscriptions.
4. Simple, direct workflows over features that add setup or maintenance without making decisions easier.
5. Portable user data over dependence on a proprietary format alone.
6. The individual's interests over partnerships or incentives to keep subscriptions active.

## Scope and direction

EverySub centers on subscription and collection management, spending summaries, upcoming renewals, invoice projections and snapshots, portable exports, and optional smart import. Spending visibility and upcoming renewals are the primary value; invoice history provides supporting context. Whether to support multiple currencies remains open.

## Boundaries and trust

EverySub tracks expected subscription billing. It does not connect to subscription providers, cancel a subscription on the user's behalf, or verify that an invoice was paid. Subscription-provider sync is outside the product's direction. Manual entry and reviewed imports remain the core; any future bank connection must be optional and explicitly approved by the user. Invoice history records due schedule snapshots, not reconciled transactions.

For smart import, the app sends selected files to OpenAI for extraction and does not store the uploaded files. Candidates are shown for review before being written as subscriptions. The app records smart import usage metadata, so product privacy claims should distinguish file content from operational metadata.

EverySub is a paid product with the individual user as the customer. Pricing and tiers are undecided. Revenue should not depend on selling user data, promoting subscriptions, or distorting guidance about what to keep.
