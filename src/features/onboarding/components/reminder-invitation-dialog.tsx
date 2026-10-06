import { useNavigate } from '@tanstack/react-router';
import { BellIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMarkReminderInvitationShown } from '@/features/onboarding/mutations';
import type { ReminderInvitationData } from '@/features/onboarding/queries';

type ReminderInvitationDialogProps = {
  /** The pending invitation, if the account has one. */
  invitation: ReminderInvitationData | null;
  /** False while another dialog on the page is open. */
  ready: boolean;
  /** Used when the collection that triggered the invitation was deleted. */
  fallbackCollection: { id: string; name: string };
  /** Where focus goes when the dialog closes. */
  finalFocus: React.RefObject<HTMLElement | null>;
};

/**
 * Offers reminder setup once, after the account's first saved subscription.
 * Showing it uses it up, so skipping, closing, or refreshing never brings it
 * back; reminders stay a click away in notification settings.
 */
export function ReminderInvitationDialog({
  invitation,
  ready,
  fallbackCollection,
  finalFocus,
}: ReminderInvitationDialogProps) {
  const navigate = useNavigate();
  const { mutate: markShown } = useMarkReminderInvitationShown();
  // Marking it shown drops it from the cache, so the dialog keeps its own copy.
  const [shown, setShown] = useState<ReminderInvitationData | null>(null);
  const [open, setOpen] = useState(false);

  if (invitation && ready && !shown) {
    setShown(invitation);
    setOpen(true);
  }

  useEffect(() => {
    if (shown) {
      markShown();
    }
  }, [shown, markShown]);

  const collection = shown?.collection ?? fallbackCollection;

  function handleSetUp() {
    setOpen(false);
    void navigate({
      to: '/settings/notifications',
      search: { remindersFor: collection.id },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent finalFocus={finalFocus}>
        <DialogHeader className="gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/15 ring-inset"
            aria-hidden
          >
            <BellIcon className="size-5" />
          </span>
          <DialogTitle className="text-base">
            Set up renewal reminders?
          </DialogTitle>
          <DialogDescription className="text-pretty">
            EverySub can let you know a few days before each expected charge in{' '}
            {collection.name}, by email, Discord, or webhook. Your subscriptions
            are tracked either way, and you can set up reminders later in
            notification settings.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Skip for now
          </DialogClose>
          <Button onClick={handleSetUp}>Set up reminders</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
