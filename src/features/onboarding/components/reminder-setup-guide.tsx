import { Link } from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CircleCheckIcon,
  CircleDashedIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getTimeZoneAbbreviation } from '@/features/notifications/time';
import { cn } from '@/lib/utils';

export type ReminderSetupProgress = {
  schedule: { timeZone: string; reminderLeadDays: number } | null;
  /** Destinations that can deliver, whether or not anything routes to them. */
  deliverableDestinations: { name: string }[];
  /** Deliverable destinations receiving the collection's renewal reminders. */
  reminderDestinations: { name: string }[];
};

type ReminderSetupGuideProps = {
  step: 'account' | 'collection';
  collection: { id: string; name: string };
  progress: ReminderSetupProgress;
};

/**
 * Walks through reminder setup across the existing settings pages: account
 * notification settings for the schedule and a destination, then the
 * collection's settings to route its reminders. The same checklist shows on
 * both, so a ready destination alone never reads as finished.
 */
export function ReminderSetupGuide({
  step,
  collection,
  progress,
}: ReminderSetupGuideProps) {
  const { schedule, deliverableDestinations, reminderDestinations } = progress;
  const isComplete = reminderDestinations.length > 0;

  return (
    <section
      aria-labelledby="reminder-setup-title"
      className="overflow-hidden rounded-xl bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10"
    >
      <div className="flex flex-col gap-1 px-6 pt-5 pb-4">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Reminder setup · Step {step === 'account' ? 1 : 2} of 2
        </p>
        <h2
          id="reminder-setup-title"
          className="font-heading text-base font-semibold"
        >
          {isComplete
            ? `Reminders are on for ${collection.name}`
            : `Set up reminders for ${collection.name}`}
        </h2>
        <p className="text-sm text-pretty text-muted-foreground">
          {isComplete
            ? 'Reminders send at 9:00 AM in your time zone, starting with the next charge that’s still far enough ahead. Nothing is sent right away.'
            : step === 'account'
              ? `Check when reminders send and add where they should go. Nothing is sent until ${collection.name} turns reminders on in the next step.`
              : `Turn on renewal reminders for a destination below. Before anything is saved, you’ll choose which ${collection.name} subscriptions they can include.`}
        </p>
      </div>

      <ol className="divide-y border-y">
        <ChecklistItem
          done={schedule !== null}
          title="Schedule"
          detail={
            schedule
              ? `9:00 AM ${getTimeZoneAbbreviation(schedule.timeZone)} (${schedule.timeZone}), ${schedule.reminderLeadDays} ${schedule.reminderLeadDays === 1 ? 'day' : 'days'} before each expected charge`
              : 'Choose your time zone'
          }
        />
        <ChecklistItem
          done={deliverableDestinations.length > 0}
          title="Destination"
          detail={
            deliverableDestinations.length > 0
              ? formatNames(deliverableDestinations)
              : 'Add email, a Discord webhook, or your own webhook'
          }
        />
        <ChecklistItem
          done={isComplete}
          current={step === 'collection'}
          title={`Reminders for ${collection.name}`}
          detail={
            isComplete
              ? `Sending to ${formatNames(reminderDestinations)}`
              : 'Turn them on for a destination and review which subscriptions are included'
          }
        />
      </ol>

      <div className="flex flex-wrap items-center justify-end gap-2 px-6 py-4">
        {step === 'account' ? (
          <Button
            nativeButton={false}
            render={
              <Link
                to="/c/$collectionId/settings"
                params={{ collectionId: collection.id }}
                search={{ setup: 'reminders' }}
              />
            }
          >
            Continue to collection reminders
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              className="mr-auto"
              nativeButton={false}
              render={
                <Link
                  to="/settings/notifications"
                  search={{ remindersFor: collection.id }}
                />
              }
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Schedule and destinations
            </Button>
            {isComplete ? (
              <Button
                nativeButton={false}
                render={
                  <Link
                    to="/c/$collectionId/dashboard"
                    params={{ collectionId: collection.id }}
                  />
                }
              >
                Done
              </Button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function ChecklistItem({
  done,
  current = false,
  title,
  detail,
}: {
  done: boolean;
  current?: boolean;
  title: string;
  detail: string;
}) {
  const Icon = done ? CircleCheckIcon : CircleDashedIcon;

  return (
    <li
      className={cn(
        'flex items-start gap-3 px-6 py-3',
        current && !done && 'bg-muted/40',
      )}
      aria-current={current ? 'step' : undefined}
    >
      <Icon
        className={cn(
          'mt-0.5 size-4 shrink-0',
          done ? 'text-primary' : 'text-muted-foreground',
        )}
        aria-hidden
      />
      <div className="min-w-0 text-sm">
        <p className="font-medium">
          {title}
          <span className="sr-only">{done ? ', done' : ', not done yet'}</span>
        </p>
        <p className="text-pretty text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

function formatNames(destinations: { name: string }[]): string {
  return new Intl.ListFormat('en', { type: 'conjunction' }).format(
    destinations.map((destination) => destination.name),
  );
}
