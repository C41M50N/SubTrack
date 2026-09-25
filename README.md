**T**anStack Start + **B**etter Auth + **D**rizzle Starter

A practical starter for building a TanStack Start app with authentication, database ORM, and modern styling.

## Who this is for

- Devs evaluating TanStack Start with a real auth + DB setup
- Teams that want a clean foundation without a heavy UI kit
- Anyone who wants type-safe routing, typed data loaders, and a straightforward auth flow

## What is included

- TanStack Start + Router file-based routing
- TanStack Query wired into router SSR (not used by default to keep the template lean)
- Better Auth with Google provider and server handler route
- Drizzle ORM schema + migrations wiring for PostgreSQL
- Tailwind CSS v4 setup
- Portless local HTTPS URLs for dev (`https://tbd.localhost`)
- Oxlint for linting
- Oxfmt for formatting
- Protected routes + login flow

## Quick start

```bash
bun install
bun run dev
```

The dev script runs Vite through `portless`, so the app is available at `https://tbd.localhost` instead of a fixed `localhost:<port>` URL. On first run, `portless` may prompt to trust its local certificate and start the local proxy.

## Environment variables

Create a `.env.local` file in the project root (see `.env.schema`):

```
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

`.env.schema` is the source of truth for env vars and is used by varlock to generate `env.d.ts`.

## Auth setup

- Auth handler lives at `/api/auth/*`.
- Update your OAuth callback URLs to match your local and production origins (for Google locally: `https://tbd.localhost/api/auth/callback/google`).
- Server auth code is in `src/features/auth/server.ts`.
- Client auth code is in `src/features/auth/client.ts`.
- Server function auth middleware is in `src/features/auth/middleware.ts`.

## Database + Drizzle

The schema entry point is `src/lib/db/schema.ts`.

```bash
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:studio
```

## Scripts

- Dev server: `bun run dev`
- Production build: `bun run build`
- Lint: `bun run lint`
- Lint with fixes: `bun run lint:fix`
- Format: `bun run fmt`
- Format (check only): `bun run fmt:check`
- Tests: `bun run test`
- Generate Drizzle migrations: `bun run db:generate`
- Run Drizzle migrations: `bun run db:migrate`
- Push schema changes: `bun run db:push`
- Open Drizzle Studio: `bun run db:studio`

Linting is configured in `.oxlintrc.json` and formatting is configured in `.oxfmtrc.json`.

## Project structure

- `src/features/auth`: auth server/client/session/middleware helpers
- `src/lib/db`: Drizzle client + schema
- `src/router.tsx`: router setup, including TanStack Query SSR integration
- `src/routes`: file-based routes (including protected routes)
- `src/styles.css`: Tailwind setup
- `docs/tech-stack`: stack notes and conventions

## Next steps

- Setup Shadcn/ui: `bunx --bun shadcn@latest init`
- Add your own routes in `src/routes`
- Add additional OAuth providers in `src/features/auth/server.ts`
- Create your app schema in `src/lib/db/schema.ts`

## Learn more

- TanStack Start: https://tanstack.com/start
- TanStack Router: https://tanstack.com/router
- TanStack Query: https://tanstack.com/query
- Better Auth: https://better-auth.com
- Drizzle ORM: https://orm.drizzle.team
- Tailwind CSS: https://tailwindcss.com
- Portless: https://portless.sh
- Oxlint: https://oxc.rs/docs/guide/usage/linter.html
- Oxfmt: https://oxc.rs/docs/guide/usage/formatter.html
