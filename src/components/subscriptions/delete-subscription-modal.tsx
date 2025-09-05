import { IconTrash } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SubscriptionId } from '@/features/subscriptions';
import { type ModalState, useDeleteSubscription } from '@/lib/hooks';

type DeleteSubscriptionModalProps = {
  state: ModalState;
  subscription_id: SubscriptionId;
  subscription_name: string;
};

export default function DeleteSubscriptionModal({
  state,
  subscription_id,
  subscription_name,
}: DeleteSubscriptionModalProps) {
  const { deleteSubscription, isDeleteSubscriptionLoading } =
    useDeleteSubscription();

  async function onSubmit() {
    await deleteSubscription({ subscriptionId: subscription_id });
    state.setState('closed');
  }

  return (
    <Dialog
      onOpenChange={(open) => !open && state.setState('closed')}
      open={state.state === 'open'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {subscription_name}?</DialogTitle>
          <DialogDescription className="pt-0.5">
            Are you sure you want to permanently delete this subscription?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-6">
          <Button
            className="gap-1"
            isLoading={isDeleteSubscriptionLoading}
            onClick={onSubmit}
            type="submit"
            variant={'destructive'}
          >
            <IconTrash size={18} strokeWidth={1.75} />
            <span>Delete</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
