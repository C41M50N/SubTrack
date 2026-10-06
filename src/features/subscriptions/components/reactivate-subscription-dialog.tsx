import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatInvoiceDate } from '@/features/subscriptions/format';
import { useReactivateSubscriptions } from '@/features/subscriptions/mutations';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';
import { getNextInvoiceDateOnOrAfter } from '@/jobs/invoice-schedule';

type ReactivateSubscriptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptions: SubscriptionRecord[];
  onReactivated?: () => void;
};

export function ReactivateSubscriptionDialog(
  props: ReactivateSubscriptionDialogProps,
) {
  if (props.subscriptions.length > 1) {
    return <BulkReactivateDialog {...props} />;
  }

  return <SingleReactivateDialog {...props} />;
}

function SingleReactivateDialog({
  open,
  onOpenChange,
  subscriptions,
  onReactivated,
}: ReactivateSubscriptionDialogProps) {
  const subscription = subscriptions[0];
  const reactivateSubscriptions = useReactivateSubscriptions();
  const [nextInvoiceDate, setNextInvoiceDate] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (open && subscription) {
      setNextInvoiceDate(
        getNextInvoiceDateOnOrAfter(
          subscription.nextInvoiceDate,
          subscription.costFrequency,
          today,
        ),
      );
    }
  }, [open, subscription, today]);

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!subscription || !nextInvoiceDate) {
      return;
    }

    reactivateSubscriptions.mutate(
      { subscriptionIds: [subscription.id], nextInvoiceDate },
      {
        onSuccess: () => {
          toast.success(`Reactivated “${subscription.name}”`);
          onOpenChange(false);
          onReactivated?.();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Reactivate “{subscription?.name ?? ''}”?</DialogTitle>
            <DialogDescription>
              Tracking resumes immediately. No invoices will be created for the
              inactive period.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel htmlFor="reactivate-next-invoice">
              Next invoice
            </FieldLabel>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    id="reactivate-next-invoice"
                    type="button"
                    variant="outline"
                    className="w-full justify-start font-normal"
                    disabled={reactivateSubscriptions.isPending}
                  />
                }
              >
                <CalendarIcon data-icon="inline-start" />
                {nextInvoiceDate
                  ? formatInvoiceDate(nextInvoiceDate)
                  : 'Pick a date'}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={
                    nextInvoiceDate ? parseISO(nextInvoiceDate) : undefined
                  }
                  disabled={{ before: parseISO(today) }}
                  onSelect={(date) =>
                    date && setNextInvoiceDate(format(date, 'yyyy-MM-dd'))
                  }
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            <FieldDescription>
              Choosing today may record an invoice on the next processing run.
            </FieldDescription>
          </Field>

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" />}
              disabled={reactivateSubscriptions.isPending}
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={reactivateSubscriptions.isPending || !nextInvoiceDate}
            >
              {reactivateSubscriptions.isPending
                ? 'Reactivating…'
                : 'Reactivate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BulkReactivateDialog({
  open,
  onOpenChange,
  subscriptions,
  onReactivated,
}: ReactivateSubscriptionDialogProps) {
  const reactivateSubscriptions = useReactivateSubscriptions();
  const count = subscriptions.length;

  function handleConfirm() {
    reactivateSubscriptions.mutate(
      { subscriptionIds: subscriptions.map((subscription) => subscription.id) },
      {
        onSuccess: () => {
          toast.success(`Reactivated ${count} subscriptions`);
          onOpenChange(false);
          onReactivated?.();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reactivate {count} subscriptions?</AlertDialogTitle>
          <AlertDialogDescription>
            Each billing schedule will resume at its first occurrence on or
            after today. No invoices will be created for the inactive period.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={reactivateSubscriptions.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={reactivateSubscriptions.isPending}
          >
            {reactivateSubscriptions.isPending ? 'Reactivating…' : 'Reactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
