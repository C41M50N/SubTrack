# TanStack Start + Router

## Not Found handling

The app configures a root-level `notFoundComponent` in `src/routes/__root.tsx` to provide a consistent 404 page and avoid TanStack Router's generic fallback warning.

When a route does not match, TanStack Router renders this component instead of the default `<p>Not Found</p>` output.

Use TanStack Router's `Link` component for internal navigation (for example, the Not Found page links back home via `<Link to="/">`).

## Query integration

TanStack Query is wired into Router SSR in `src/router.tsx`.

See [TanStack Start x Query](./tanstack-start-query.md) for route data conventions.
