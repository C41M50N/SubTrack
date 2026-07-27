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
import { useDeleteSubscriptions } from '@/features/subscriptions/mutations';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';

type DeleteSubscriptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptions: SubscriptionRecord[];
  onDeleted?: () => void;
};

export function DeleteSubscriptionDialog({
  open,
  onOpenChange,
  subscriptions,
  onDeleted,
}: DeleteSubscriptionDialogProps) {
  const deleteSubscriptions = useDeleteSubscriptions();

  const count = subscriptions.length;
  const isBulk = count > 1;
  const title = isBulk
    ? `Delete ${count} subscriptions?`
    : `Delete “${subscriptions[0]?.name ?? ''}”?`;

  function handleConfirm() {
    if (count === 0) {
      return;
    }

    deleteSubscriptions.mutate(
      subscriptions.map((subscription) => subscription.id),
      {
        onSuccess: () => {
          toast.success(
            isBulk
              ? `Deleted ${count} subscriptions`
              : `Deleted “${subscriptions[0]?.name ?? ''}”`,
          );
          onOpenChange(false);
          onDeleted?.();
        },
        onError: () => toast.error('Failed to delete'),
      },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes{' '}
            {isBulk ? 'these subscriptions' : 'this subscription'} and cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteSubscriptions.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteSubscriptions.isPending}
          >
            {deleteSubscriptions.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
