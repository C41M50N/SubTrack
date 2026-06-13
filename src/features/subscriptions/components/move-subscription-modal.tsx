import { IconArrowsExchange } from '@tabler/icons-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CollectionWithoutUserId } from '@/features/collections';
import type { Subscription } from '@/features/subscriptions';
import { useMoveSubscription } from '@/features/subscriptions/hooks';
import type { ModalState } from '@/lib/modal-state';

type MoveSubscriptionModalProps = {
  state: ModalState;
  subscription: Subscription;
  collections: CollectionWithoutUserId[];
};

export default function MoveSubscriptionModal({
  state,
  subscription,
  collections,
}: MoveSubscriptionModalProps) {
  const { moveSubscription, isMoveSubscriptionLoading } = useMoveSubscription();

  const destinationCollections = React.useMemo(
    () =>
      collections.filter(
        (collection) => collection.id !== subscription.collection_id
      ),
    [collections, subscription.collection_id]
  );

  const [destinationCollectionId, setDestinationCollectionId] = React.useState(
    destinationCollections[0]?.id ?? ''
  );

  React.useEffect(() => {
    if (state.state !== 'open') {
      return;
    }

    setDestinationCollectionId(destinationCollections[0]?.id ?? '');
  }, [destinationCollections, state.state]);

  async function onSubmit() {
    if (!destinationCollectionId) {
      return;
    }

    await moveSubscription({
      subscriptionId: subscription.id,
      destinationCollectionId,
    });
    state.setState('closed');
  }

  return (
    <Dialog
      onOpenChange={(open) => !open && state.setState('closed')}
      open={state.state === 'open'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {subscription.name}?</DialogTitle>
          <DialogDescription className="pt-0.5">
            Choose the collection you want to move this subscription into.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="font-medium text-sm">Destination collection</div>
          <Select
            onValueChange={setDestinationCollectionId}
            value={destinationCollectionId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select collection" />
            </SelectTrigger>
            <SelectContent>
              {destinationCollections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="pt-6">
          <Button
            className="gap-1"
            disabled={!destinationCollectionId}
            isLoading={isMoveSubscriptionLoading}
            onClick={onSubmit}
            type="button"
          >
            <IconArrowsExchange size={18} strokeWidth={1.75} />
            <span>Move</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
