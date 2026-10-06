import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { CollectionNotifications } from '@/features/notifications/components/collection-notifications';
import {
  collectionNotificationsQueryOptions,
  type CollectionNotificationsData,
} from '@/features/notifications/queries';
import {
  canDeliver,
  getReminderDestinations,
} from '@/features/notifications/reminder-setup';
import { ReminderSetupGuide } from '@/features/onboarding/components/reminder-setup-guide';
import { validateCollectionSettingsSearch } from '@/features/onboarding/search';
import { SeedDataCard } from '@/features/subscriptions/components/seed-data-card';

export const Route = createFileRoute('/_protected/c/$collectionId/settings')({
  validateSearch: validateCollectionSettingsSearch,
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      collectionNotificationsQueryOptions(params.collectionId),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { collectionId } = Route.useParams();
  const { setup } = Route.useSearch();
  const guided = setup === 'reminders';

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage this collection.</p>
      </header>

      <div className="flex max-w-4xl flex-col gap-8">
        {guided ? (
          <CollectionReminderSetup collectionId={collectionId} />
        ) : null}

        <CollectionNotifications
          collectionId={collectionId}
          guidedReminderSetup={guided}
        />

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

function CollectionReminderSetup({ collectionId }: { collectionId: string }) {
  const { data } = useSuspenseQuery(
    collectionNotificationsQueryOptions(collectionId),
  );

  return (
    <ReminderSetupGuide
      step="collection"
      collection={data.collection}
      progress={getProgress(data)}
    />
  );
}

function getProgress(data: CollectionNotificationsData) {
  return {
    schedule: data.schedule,
    deliverableDestinations: data.destinations.filter(canDeliver),
    reminderDestinations: getReminderDestinations(data),
  };
}
