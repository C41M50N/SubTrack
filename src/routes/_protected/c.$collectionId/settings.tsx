import { createFileRoute } from '@tanstack/react-router';

import { CollectionNotifications } from '@/features/notifications/components/collection-notifications';
import { collectionNotificationsQueryOptions } from '@/features/notifications/queries';
import { SeedDataCard } from '@/features/subscriptions/components/seed-data-card';

export const Route = createFileRoute('/_protected/c/$collectionId/settings')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      collectionNotificationsQueryOptions(params.collectionId),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { collectionId } = Route.useParams();

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage this collection.</p>
      </header>

      <div className="flex max-w-4xl flex-col gap-8">
        <CollectionNotifications collectionId={collectionId} />

        {import.meta.env.DEV ? (
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold">Developer</h2>
            <SeedDataCard collectionId={collectionId} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
