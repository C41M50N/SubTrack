import { zodResolver } from '@hookform/resolvers/zod';
import type { Collection } from '@prisma/client';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import type z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import {
  CreateSubscriptionSchema,
  type Subscription,
} from '@/features/subscriptions';
import { SubscriptionFormFields } from '@/features/subscriptions/components/subscription-form-fields';
import { useUpdateSubscription } from '@/features/subscriptions/hooks';
import { fromCents } from '@/features/subscriptions/money';
import dayjs from '@/lib/dayjs';
import type { ModalState } from '@/lib/modal-state';

type EditSubscriptionModalProps = {
  state: ModalState;
  subscription: Subscription;
  categories: string[];
  collections: Omit<Collection, 'user_id'>[];
};

export default function EditSubscriptionModal({
  state,
  subscription,
  categories,
  collections,
}: EditSubscriptionModalProps) {
  const { updateSubscription, isUpdateSubscriptionLoading } =
    useUpdateSubscription();

  const form = useForm<z.infer<typeof CreateSubscriptionSchema>>({
    resolver: zodResolver(CreateSubscriptionSchema),
    defaultValues: {
      ...subscription,
      amount: fromCents(subscription.amount),
      next_invoice: new Date(subscription.next_invoice),
    },
  });

  async function onSubmit(values: z.infer<typeof CreateSubscriptionSchema>) {
    await updateSubscription({ id: subscription.id, ...values });
    state.setState('closed');
  }

  return (
    <Dialog
      onOpenChange={(open) => !open && state.setState('closed')}
      open={state.state === 'open'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <SubscriptionFormFields
              categories={categories}
              collections={collections}
              form={form}
              formatInvoiceDate={(date) => (
                <span>{dayjs(date).format('ll')}</span>
              )}
            />

            <DialogFooter>
              <Button
                className="gap-1"
                isLoading={isUpdateSubscriptionLoading}
                type="submit"
              >
                <IconDeviceFloppy size={20} strokeWidth={1.75} />
                <span>Save</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
