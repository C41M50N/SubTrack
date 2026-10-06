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
import {
  useDeactivateSubscriptions,
  useUndoDeactivation,
} from '@/features/subscriptions/mutations';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';

type DeactivateSubscriptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptions: SubscriptionRecord[];
  onDeactivated?: () => void;
};

export function DeactivateSubscriptionDialog({
  open,
  onOpenChange,
  subscriptions,
  onDeactivated,
}: DeactivateSubscriptionDialogProps) {
  const deactivateSubscriptions = useDeactivateSubscriptions();
  const undoDeactivation = useUndoDeactivation();
  const count = subscriptions.length;
  const isBulk = count > 1;
  const title = isBulk
    ? `Deactivate ${count} subscriptions?`
    : `Deactivate “${subscriptions[0]?.name ?? ''}”?`;

  function handleConfirm() {
    if (count === 0) {
      return;
    }

    const subscriptionIds = subscriptions.map(
      (subscription) => subscription.id,
    );

    deactivateSubscriptions.mutate(subscriptionIds, {
      onSuccess: (result) => {
        onOpenChange(false);
        onDeactivated?.();
        toast.success(
          isBulk
            ? `Deactivated ${count} subscriptions`
            : `Deactivated “${subscriptions[0]?.name}”`,
          {
            duration: 8_000,
            action: {
              label: 'Undo',
              onClick: () => {
                undoDeactivation.mutate(
                  {
                    subscriptionIds,
                    deactivatedAt: result.deactivatedAt,
                  },
                  {
                    onSuccess: () =>
                      toast.success(
                        isBulk
                          ? `Reactivated ${count} subscriptions`
                          : 'Reactivated subscription',
                      ),
                    onError: () =>
                      toast.error(
                        'Could not undo deactivation. Refresh and try again.',
                      ),
                  },
                );
              },
            },
          },
        );
      },
      onError: () =>
        toast.error('Failed to deactivate. Refresh and try again.'),
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk ? 'These subscriptions' : 'This subscription'} will stop
            creating future invoices and move to Inactive. Recorded invoice
            history will remain.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deactivateSubscriptions.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deactivateSubscriptions.isPending}
          >
            {deactivateSubscriptions.isPending ? 'Deactivating…' : 'Deactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
