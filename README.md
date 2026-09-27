# EverySub

EverySub helps you see what your subscriptions cost, when they renew, and how those charges add up. It brings subscription details, upcoming invoices, recorded billing history, and spending trends into one place.

The project is in development and currently serves one person, while being built as an open source product and portfolio project. See [PRODUCT.md](PRODUCT.md) for the product direction and decision principles.

## What works today

- Organize subscriptions in collections and categories. Add, edit, deactivate, reactivate, delete, and move them between collections.
- Track weekly, monthly, yearly, and biennial billing schedules in USD. See effective monthly and yearly costs and the next expected charge.
- Review collection dashboards with cost metrics, spending trends, category breakdowns, upcoming invoices, and recently recorded invoices.
- Explore projected upcoming invoices and recorded invoice history separately. Recorded entries are schedule snapshots; EverySub does not verify payment.
- Import and export subscriptions as JSON or CSV. An optional smart import finds candidates in statements, receipts, and screenshots, then lets you review them before saving.

## Stack

TanStack Start and Router, React, TanStack Query, Better Auth with Google sign-in, Drizzle ORM and PostgreSQL, Tailwind CSS, and optional OpenAI-powered import. Bun runs the local scripts. Portless provides local HTTPS.

## Local setup

Install dependencies and create `.env.local` in the project root. [`.env.schema`](.env.schema) defines the required and optional variables.

```bash
bun install
```

```dotenv
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://dev.everysub.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Optional: enables smart import
OPENAI_API_KEY=
# Optional: subscription brand icons
LOGO_DEV_SECRET_KEY=
LOGO_DEV_PUBLISHABLE_KEY=
```

Set the Google OAuth callback URL to `https://dev.everysub.com/api/auth/callback/google`. Apply the existing Drizzle migrations to your local database with `bun run db:migrate`.

```bash
bun run dev
```

The app runs at **https://dev.everysub.com**. The dev script requests `.com` (alongside `.dev` and `.localhost`) and registers `dev.everysub`. Portless manages the local HTTPS certificate and hosts entry. If an existing Portless proxy was started without `.com` support, restart it from an interactive terminal before running the app:

```bash
bunx portless proxy stop
bunx portless proxy start --tld com --tld dev --tld localhost
```

Portless may ask for your system password because the HTTPS proxy uses port 443. Restarting the shared proxy may briefly disconnect other local Portless apps.

## Scripts

| Command                    | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| `bun run dev`              | Start the local HTTPS app                  |
| `bun run build`            | Build the production app                   |
| `bun run start`            | Serve the production build                 |
| `bun run test`             | Run Vitest tests                           |
| `bun run lint`             | Run Oxlint                                 |
| `bun run fmt:check`        | Check formatting with Oxfmt                |
| `bun run db:migrate`       | Apply existing Drizzle migrations          |
| `bun run db:push`          | Push the current schema during development |
| `bun run db:studio`        | Open Drizzle Studio                        |
| `bun run invoices:process` | Process due invoice snapshots              |
| `bun run import:eval`      | Run the smart import evaluation script     |

`db:generate` exists for authoring migrations, but should only be run when explicitly requested by the project owner.

## Project map

- [`src/features`](src/features) contains the subscription, collection, invoice, dashboard, auth, and import features.
- [`src/routes`](src/routes) contains public and collection-scoped app routes and API endpoints.
- [`src/lib/db`](src/lib/db) holds the Drizzle schema and database client; [`drizzle`](drizzle) holds migrations.
- [`docs/requirements`](docs/requirements) captures detailed behavior for invoices and imports.
- [`fixtures/synthetic-statement.pdf`](fixtures/synthetic-statement.pdf) is fictional data for smart import demos and testing.

## Current limits

The app supports USD only; multi-currency support remains open. Renewal reminders are part of the product direction but are not implemented yet.

Smart import is available only when `OPENAI_API_KEY` is configured. Uploaded files are sent to OpenAI for extraction and are not stored by EverySub. Import suggestions require review before saving.
