# TanStack Start x Query

This starter wires TanStack Query into TanStack Router SSR in `src/router.tsx`.
Use Router loaders to start route data work early and TanStack Query to own the long-lived client cache.

## Route data pattern

For route-backed server state, prefer this flow:

1. Build reusable query option factories in the feature layer.
2. Derive route-specific query options once in the route `context`.
3. Prime the cache in the route `loader` with `context.queryClient.ensureQueryData(...)`.
4. Read data in the route component with `useSuspenseQuery(...)` or `useQuery(...)`.

Example shape:

```ts
export const Route = createFileRoute('/items/$itemId')({
  context: ({ params }) => ({
    itemQueryOptions: itemQueryOptions(params.itemId),
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.itemQueryOptions),
  component: ItemRoute,
});

function ItemRoute() {
  const { itemQueryOptions } = Route.useRouteContext();
  const { data: item } = useSuspenseQuery(itemQueryOptions);

  return <ItemView item={item} />;
}
```

## Why we do it this way

- Query stays the source of truth for shared server state.
- Loaders still help with preloading and route transitions.
- Components get normal Query behavior like cache reuse and targeted invalidation.
- Query option factories stay reusable for tests, prefetching, and mutations.
- The per-router `QueryClient` avoids sharing authenticated SSR cache data across requests.

## Mutation guidance

When a mutation returns the canonical updated entity, prefer targeted cache updates with `queryClient.setQueryData(...)`.

When a mutation affects broader derived state or the returned payload is incomplete, prefer targeted `queryClient.invalidateQueries(...)`.

Avoid broad `router.invalidate()` calls when a more precise Query update is practical.

## Query key conventions

Use stable, feature-owned query keys. Common shapes:

```ts
export const itemsListQueryKey = ['items', 'list'] as const;

export function itemDetailQueryKey(itemId: string) {
  return ['items', 'detail', itemId] as const;
}
```

Keep related query option factories and cache helpers near the feature that owns the server state.
