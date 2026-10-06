import { useNavigate } from '@tanstack/react-router';
import { BellIcon } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useMarkReminderInvitationShown } from '@/features/onboarding/mutations';
import type { ReminderInvitationData } from '@/features/onboarding/queries';
import { formatUpcomingDay } from '@/features/subscriptions/format';

type ReminderInvitationCardProps = {
  /** The pending invitation, if the account has one. */
  invitation: ReminderInvitationData | null;
  /** False while onboarding or a dialog is up, so it waits to be seen. */
  ready: boolean;
  /** The dashboard's collection, also used when the invitation's collection was deleted. */
  currentCollection: { id: string; name: string };
  /** The dashboard collection's next charge, to make the invitation concrete. */
  nextCharge: { name: string; date: string } | null;
  now: Date;
  /** Called after "Not now" removes the card, so focus can move on. */
  onDismiss: () => void;
};

/**
 * Offers reminder setup once, at the top of the dashboard after onboarding.
 * Showing it uses it up, so dismissing it, leaving, or refreshing never brings
 * it back; reminders stay a click away in notification settings.
 */
export function ReminderInvitationCard({
  invitation,
  ready,
  currentCollection,
  nextCharge,
  now,
  onDismiss,
}: ReminderInvitationCardProps) {
  const titleId = useId();
  const navigate = useNavigate();
  const { mutate: markShown } = useMarkReminderInvitationShown();
  // Marking it shown drops it from the cache, so the card keeps its own copy.
  const [shown, setShown] = useState<ReminderInvitationData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (invitation && ready && !shown) {
    setShown(invitation);
  }

  useEffect(() => {
    if (shown) {
      markShown();
    }
  }, [shown, markShown]);

  if (!shown || dismissed) {
    return null;
  }

  const collection = shown.collection ?? currentCollection;
  // The next charge comes from this dashboard, so it only fits an invitation
  // for the same collection.
  const charge = collection.id === currentCollection.id ? nextCharge : null;

  return (
    <section
      aria-labelledby={titleId}
      className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 py-4 pr-5 pl-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-500 dark:border-primary-light/20 dark:bg-primary-light/5"
    >
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-xs ring-1 ring-primary/15 dark:text-primary-light dark:ring-primary-light/20"
      >
        <BellIcon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 id={titleId} className="text-base font-semibold text-pretty">
          {charge
            ? `${charge.name} renews ${formatUpcomingDay(charge.date, now)}. Want a heads-up next time?`
            : 'Want a heads-up before renewals?'}
        </h2>
        <p className="text-sm text-pretty text-muted-foreground">
          EverySub can let you know a few days before each charge in{' '}
          {collection.name}, by email, Discord, or webhook.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            setDismissed(true);
            onDismiss();
          }}
        >
          Not now
        </Button>
        <Button
          onClick={() =>
            void navigate({
              to: '/settings/notifications',
              search: { remindersFor: collection.id },
            })
          }
        >
          Set up reminders
        </Button>
      </div>
    </section>
  );
}
