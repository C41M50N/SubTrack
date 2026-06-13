import { zodResolver } from '@hookform/resolvers/zod';
import { IconDeviceFloppy } from '@tabler/icons-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CollectionWithoutUserId } from '@/features/collections';
import { useEditCollectionTitle } from '@/features/collections/hooks';
import type { ModalState } from '@/lib/modal-state';

type Props = {
  state: ModalState;
  collection: CollectionWithoutUserId;
};

const COLLECTION_TITLE_MIN_LENGTH = 2;
const COLLECTION_TITLE_MAX_LENGTH = 30;

const FormSchema = z.object({
  title: z
    .string()
    .min(COLLECTION_TITLE_MIN_LENGTH, {
      message: 'Title must be at least 2 characters',
    })
    .max(COLLECTION_TITLE_MAX_LENGTH, {
      message: 'Title must be at most 30 characters',
    }),
});

export default function EditCollectionModal({ state, collection }: Props) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: collection.title,
    },
  });

  const { editCollectionTitle, isEditCollectionLoading } =
    useEditCollectionTitle();

  React.useEffect(() => {
    form.setValue('title', collection.title);
  }, [collection.title, form]);

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    await editCollectionTitle({
      title: values.title,
      collection_id: collection.id,
    });
    form.reset();
    state.setState('closed');
  }

  return (
    <Dialog
      onOpenChange={(open) => !open && state.setState('closed')}
      open={state.state === 'open'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Collection Title"
                      {...field}
                      type="search"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                className="gap-1"
                isLoading={isEditCollectionLoading}
                type="submit"
              >
                <IconDeviceFloppy size={20} strokeWidth={1.75} />
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
