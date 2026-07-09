import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useCreateCollection } from '@/features/collections/mutations';
import { collectionNameSchema } from '@/features/collections/schema';

interface NewCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewCollectionDialog({
  open,
  onOpenChange,
}: NewCollectionDialogProps) {
  const navigate = useNavigate();
  const createCollection = useCreateCollection();

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setName('');
      setError(null);
    }

    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = collectionNameSchema.safeParse(name);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid name');
      return;
    }

    setError(null);

    createCollection.mutate(parsed.data, {
      onSuccess: (collection) => {
        toast.success(`Collection "${collection.name}" created`);
        handleOpenChange(false);
        navigate({
          to: '/c/$collectionId/dashboard',
          params: { collectionId: collection.id },
        });
      },
      onError: (mutationError) => {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : 'Failed to create collection',
        );
        toast.error('Failed to create collection');
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-84">
        <form onSubmit={handleSubmit} className="grid gap-6">
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
            <DialogDescription>
              Group related subscriptions together.
              <br />
              You can rename it later.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="collection-name">Name</FieldLabel>
            <Input
              id="collection-name"
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="e.g. Personal, Work, Streaming"
              aria-invalid={error ? true : undefined}
              disabled={createCollection.isPending}
            />
            <FieldError>{error}</FieldError>
          </Field>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" type="button" />}
              disabled={createCollection.isPending}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={createCollection.isPending}>
              {createCollection.isPending ? 'Creating…' : 'Create collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
