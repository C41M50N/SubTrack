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
import { toast } from '@/components/ui/use-toast';
import type { ModalState } from '@/lib/hooks';
import { api } from '@/utils/api';

type Props = {
  state: ModalState;
};

const FormSchema = z.object({
  title: z
    .string()
    .min(2, { message: 'Title must be at least 2 characters' })
    .max(30, { message: 'Title must be at most 30 characters' }),
});

export default function NewCollectionModal({ state }: Props) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
    },
  });

  const ctx = api.useContext();
  const {
    mutateAsync: createCollection,
    isLoading: isCreateCollectionLoading,
  } = api.collections.createCollection.useMutation({
    onSuccess(data, variables, context) {
      form.reset();
      ctx.collections.getCollections.refetch();
    },
    onError(error, variables, context) {
      toast({
        variant: 'error',
        title: error.message,
      });
    },
  });

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    await createCollection({ collectionTitle: values.title });
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
