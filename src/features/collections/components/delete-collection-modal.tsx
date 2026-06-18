import type { Collection } from '@prisma/client';
import { IconTrash } from '@tabler/icons-react';
import Image from 'next/image';

import { LoadingSpinner } from '@/components/common/loading-spinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useDeleteCollection } from '@/features/collections/hooks';
import { useSubscriptionsFromCollection } from '@/features/subscriptions/hooks';
import type { ModalState } from '@/lib/modal-state';
import { toProperCase } from '@/utils';

type Props = {
  state: ModalState;
  collectionId: Collection['id'];
};

export default function DeleteCollectionModal({ state, collectionId }: Props) {
  const { subscriptions, isSubscriptionsLoading } =
    useSubscriptionsFromCollection(collectionId, state.state === 'open');
  const { deleteCollection } = useDeleteCollection();

  async function onSubmit() {
    await deleteCollection({ collectionId });
    state.setState('closed');
  }

  return (
    <Dialog
      onOpenChange={(open) => !open && state.setState('closed')}
      open={state.state === 'open'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Collection</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to permanently
            delete the following subscriptions?
          </DialogDescription>
        </DialogHeader>

        {!subscriptions && <LoadingSpinner />}

        {subscriptions && (
          <div className="mt-1 space-y-2">
            <span className="font-medium text-sm leading-none">
              Subscriptions to be deleted:
            </span>
            <ScrollArea className="h-52 w-full rounded-sm border px-4">
              {subscriptions.map((sub) => (
                <div className="first:pt-3" key={sub.id}>
                  <div className="flex flex-row items-center space-x-3">
                    {sub.icon_ref.includes('.') ? (
                      <Image
                        alt={toProperCase(sub.icon_ref)}
                        className="h-[18px] w-[18px]"
                        height={18}
                        src={`/${sub.icon_ref}`}
                        width={18}
                      />
                    ) : (
                      <Image
                        alt={toProperCase(sub.icon_ref)}
                        className="h-[18px] w-[18px]"
                        height={18}
                        src={`/${sub.icon_ref}.svg`}
                        width={18}
                      />
                    )}
                    <div className="font-medium text-base">{sub.name}</div>
                  </div>
                  <Separator className="my-3" />
                </div>
              ))}
            </ScrollArea>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button
            className="gap-1"
            disabled={isSubscriptionsLoading}
            onClick={onSubmit}
            type="submit"
            variant={'destructive'}
          >
            <IconTrash size={20} strokeWidth={1.75} />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
