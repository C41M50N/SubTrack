import { zodResolver } from '@hookform/resolvers/zod';
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
import { useCreateCollection } from '@/features/collections/hooks';
import type { ModalState } from '@/lib/modal-state';

type Props = {
  state: ModalState;
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

export default function NewCollectionModal({ state }: Props) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
    },
  });

  const { createCollection, isCreateCollectionLoading } = useCreateCollection();

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    await createCollection({ collectionTitle: values.title });
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
          <DialogTitle>New Collection</DialogTitle>
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
              <Button isLoading={isCreateCollectionLoading} type="submit">
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
