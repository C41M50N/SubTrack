import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRightIcon, BellIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DESTINATION_TYPE_LABELS,
  DestinationHealthBadge,
  DestinationTypeIcon,
  NOTIFICATION_KIND_LABELS,
} from '@/features/notifications/components/destination-display';
import { InclusionList } from '@/features/notifications/components/inclusion-list';
import {
  RouteReviewDialog,
  type RouteReviewTarget,
} from '@/features/notifications/components/route-review-dialog';
import {
  useSetRoute,
  useSetSubscriptionsInclusion,
} from '@/features/notifications/mutations';
import {
  collectionNotificationsQueryOptions,
  type CollectionDestinationRecord,
  type CollectionNotificationsData,
} from '@/features/notifications/queries';
import { getTimeZoneAbbreviation } from '@/features/notifications/time';
import {
  notificationKindEnum,
  type NotificationKind,
} from '@/lib/db/notification-schema';

const KINDS = notificationKindEnum.enumValues;

/** A collection's notification routes and which of its subscriptions may appear. */
export function CollectionNotifications({
  collectionId,
}: {
  collectionId: string;
}) {
  const { data } = useSuspenseQuery(
    collectionNotificationsQueryOptions(collectionId),
  );

  return (
    <section
      className="flex flex-col gap-4"
      aria-labelledby="notifications-heading"
    >
      <div>
        <h2
          id="notifications-heading"
          className="font-heading text-lg font-semibold"
        >
          Notifications
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose where {data.collection.name} sends renewal reminders and
          monthly overviews, and which of its subscriptions they may include.
        </p>
      </div>

      {data.schedule ? null : (
        <Alert>
          <BellIcon />
          <AlertTitle>Choose your time zone first</AlertTitle>
          <AlertDescription>
            Notifications send at 9:00 AM in your time zone.{' '}
            <Link to="/settings/notifications">Set up notifications</Link> to
            turn on routes.
          </AlertDescription>
        </Alert>
      )}

      <RoutesCard data={data} />
      <InclusionCard data={data} />
    </section>
  );
}

function RoutesCard({ data }: { data: CollectionNotificationsData }) {
  const setRoute = useSetRoute();
  const [review, setReview] = useState<RouteReviewTarget | null>(null);
  const schedule = data.schedule;

  function handleToggle(
    destination: CollectionDestinationRecord,
    kind: NotificationKind,
    enabled: boolean,
  ) {
    const pairIsRouted = KINDS.some(
      (other) => destination.collectionRoutes[other],
    );

    // The first route to a destination waits for the inclusion review.
    if (enabled && !pairIsRouted) {
      setReview({ destination, kind });
      return;
    }

    setRoute.mutate(
      {
        collectionId: data.collection.id,
        destinationId: destination.id,
        kind,
        enabled,
      },
      {
        onSuccess: () =>
          toast.success(
            `${NOTIFICATION_KIND_LABELS[kind]} ${enabled ? 'on' : 'off'} for “${destination.name}”`,
          ),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b pb-(--card-spacing)">
        <CardTitle>Routes</CardTitle>
        <CardDescription>
          {schedule
            ? `Reminders send at 9:00 AM (${getTimeZoneAbbreviation(schedule.timeZone)}), ${schedule.reminderLeadDays} ${schedule.reminderLeadDays === 1 ? 'day' : 'days'} before each expected charge. Overviews send on the 1st. Turning a route on starts with the next scheduled send.`
            : 'Each route is off until you turn it on.'}
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            nativeButton={false}
            render={<Link to="/settings/notifications" />}
          >
            Manage destinations
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {data.destinations.length === 0 ? (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BellIcon />
              </EmptyMedia>
              <EmptyTitle>No destinations yet</EmptyTitle>
              <EmptyDescription>
                Add email, a Discord webhook, or your own webhook in
                notification settings, then choose what this collection sends
                there.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link to="/settings/notifications" />}
              >
                Add a destination
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-(--card-spacing)">
                  Destination
                </TableHead>
                {KINDS.map((kind) => (
                  <TableHead
                    key={kind}
                    className="w-36 text-center whitespace-normal"
                  >
                    {NOTIFICATION_KIND_LABELS[kind]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.destinations.map((destination) => (
                <TableRow key={destination.id}>
                  <TableCell className="pl-(--card-spacing) whitespace-normal">
                    <div className="flex items-center gap-3">
                      <DestinationTypeIcon
                        type={destination.type}
                        className="size-8"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {destination.name}
                          </span>
                          {destination.health === 'paused' ||
                          destination.health === 'needs_attention' ||
                          destination.health === 'failing' ? (
                            <DestinationHealthBadge
                              health={destination.health}
                            />
                          ) : null}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {DESTINATION_TYPE_LABELS[destination.type]}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  {KINDS.map((kind) => {
                    const checked = destination.collectionRoutes[kind];
                    const emailBlocked =
                      destination.type === 'email' &&
                      !data.emailAvailable &&
                      !checked;

                    return (
                      <TableCell key={kind} className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={checked}
                            onCheckedChange={(enabled) =>
                              handleToggle(destination, kind, enabled)
                            }
                            disabled={
                              setRoute.isPending ||
                              (!checked && !schedule) ||
                              emailBlocked
                            }
                            aria-label={`Send ${NOTIFICATION_KIND_LABELS[kind].toLowerCase()} for ${data.collection.name} to ${destination.name}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {emailBlocked
                              ? 'Unavailable'
                              : checked
                                ? 'On'
                                : 'Off'}
                          </span>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <RouteReviewDialog
        target={review}
        onOpenChange={(open) => {
          if (!open) {
            setReview(null);
          }
        }}
        data={data}
      />
    </Card>
  );
}

function InclusionCard({ data }: { data: CollectionNotificationsData }) {
  const setInclusion = useSetSubscriptionsInclusion();
  const includedCount = data.subscriptions.filter(
    (subscription) => subscription.notificationsIncluded,
  ).length;

  function handleChange(
    subscriptionIds: string[],
    included: boolean,
    label: string,
  ) {
    setInclusion.mutate(
      { subscriptionIds, included },
      {
        onSuccess: () =>
          toast.success(
            included
              ? `${label} can appear in notifications`
              : `${label} won’t appear in notifications`,
          ),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b pb-(--card-spacing)">
        <CardTitle>Subscriptions in notifications</CardTitle>
        <CardDescription>
          Excluded subscriptions never appear in reminders or overviews, and
          neither do their recorded invoices. Turning one off doesn’t remove
          messages that were already delivered.
        </CardDescription>
        {data.subscriptions.length > 0 ? (
          <CardAction
            className="text-sm text-muted-foreground"
            aria-live="polite"
          >
            {includedCount} of {data.subscriptions.length} included
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">
        {data.subscriptions.length === 0 ? (
          <p className="px-(--card-spacing) py-6 text-sm text-muted-foreground">
            No subscriptions in this collection yet. New subscriptions are
            included unless you turn them off.
          </p>
        ) : (
          <InclusionList
            subscriptions={data.subscriptions}
            isIncluded={(subscription) => subscription.notificationsIncluded}
            onChange={(subscription, included) =>
              handleChange(
                [subscription.id],
                included,
                `“${subscription.name}”`,
              )
            }
            disabled={setInclusion.isPending}
          />
        )}
      </CardContent>
    </Card>
  );
}
