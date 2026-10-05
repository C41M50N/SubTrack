import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { DestinationsCard } from '@/features/notifications/components/destinations-card';
import { NotificationAttentionAlert } from '@/features/notifications/components/notification-attention-alert';
import { ScheduleCard } from '@/features/notifications/components/schedule-card';
import { notificationSettingsQueryOptions } from '@/features/notifications/queries';

export const Route = createFileRoute('/_protected/settings/notifications')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(notificationSettingsQueryOptions()),
  head: () => ({ meta: [{ title: 'Notifications · EverySub' }] }),
  component: NotificationSettingsPage,
});

function NotificationSettingsPage() {
  const { data } = useSuspenseQuery(notificationSettingsQueryOptions());

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Get renewal reminders and a monthly overview by email, Discord, or
          webhook. Dates and amounts come from your schedule; EverySub never
          confirms payments.
        </p>
      </header>

      <NotificationAttentionAlert showSettingsLink={false} />
      <ScheduleCard schedule={data.schedule} />
      <DestinationsCard data={data} />

      <section className="space-y-1 text-sm text-muted-foreground">
        <h2 className="font-medium text-foreground">How delivery works</h2>
        <p>
          Each collection chooses which destinations get its reminders and
          overviews, and which of its subscriptions may appear. A destination
          receives one grouped reminder a day and one overview a month.
        </p>
        <p>
          Failed deliveries retry for about an hour. A destination that rejects
          a notification, or keeps failing, pauses until you resume it. Resuming
          doesn’t replay everything that was missed. Only reminders for charges
          that are still ahead, and the month’s overview through the 7th, can
          still go out.
        </p>
      </section>
    </div>
  );
}
