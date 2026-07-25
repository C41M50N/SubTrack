import { createFileRoute } from '@tanstack/react-router';

import { SeedDataCard } from '@/features/subscriptions/components/seed-data-card';

export const Route = createFileRoute('/_protected/c/$collectionId/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  const { collectionId } = Route.useParams();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage this collection.</p>
      </header>

      {import.meta.env.DEV ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold">Developer</h2>
          <SeedDataCard collectionId={collectionId} />
        </section>
      ) : null}
    </div>
  );
}
