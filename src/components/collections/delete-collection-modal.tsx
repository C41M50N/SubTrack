import type { Collection } from '@prisma/client';
import { IconTrash } from '@tabler/icons-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ModalState } from '@/lib/hooks';
import { toProperCase } from '@/utils';
import { api } from '@/utils/api';
import { LoadingSpinner } from '../common/loading-spinner';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { toast } from '../ui/use-toast';

type Props = {
  state: ModalState;
  collectionId: Collection['id'];
};

export default function DeleteCollectionModal({ state, collectionId }: Props) {
  const ctx = api.useContext();

  const { data: subscriptions, isLoading: isGetSubscriptionsLoading } =
    api.subscriptions.getSubscriptionsFromCollection.useQuery({ collectionId });

  const { mutateAsync: deleteCollection } =
    api.collections.deleteCollection.useMutation({
      onSuccess() {
        ctx.collections.getCollections.refetch();
        ctx.subscriptions.getSubscriptionsFromCollection.refetch();
      },
      onError(error) {
        toast({
          variant: 'error',
          title: error.message,
        });
      },
    });

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
            disabled={isGetSubscriptionsLoading}
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
