import { Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/router';
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
import { api } from '@/utils/api';
import { toast } from '../ui/use-toast';

type ConfirmDeleteAccountModalProps = {
  state: ModalState;
};

export default function ConfirmDeleteAccountModal({
  state,
}: ConfirmDeleteAccountModalProps) {
  const router = useRouter();

  const { mutate: deleteUser, isLoading: isDeleteUserLoading } =
    api.users.deleteUser.useMutation({
      onError(error) {
        toast({
          variant: 'error',
          title: 'Failed to delete account at this time',
          description: error.message,
        });
      },
      onSuccess() {
        router.push('/');
      },
    });

  return (
    <Dialog
      onOpenChange={(open) => !open && state.setState('closed')}
      open={state.state === 'open'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Note</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete your account and all of
            your subscription data?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => state.setState('closed')}
            variant={'secondary'}
          >
            Cancel
          </Button>
          <Button
            className="gap-1"
            isLoading={isDeleteUserLoading}
            onClick={() => deleteUser()}
            variant={'destructive'}
          >
            <Trash2Icon size={20} strokeWidth={1.75} />
            <span>Delete</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
