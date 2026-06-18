import { zodResolver } from '@hookform/resolvers/zod';
import type { Collection } from '@prisma/client';
import { useAtom } from 'jotai';
import React from 'react';
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
import { selectedCollectionIdAtom } from '@/features/collections/stores';
import { CreateSubscriptionSchema } from '@/features/subscriptions';
import { SubscriptionFormFields } from '@/features/subscriptions/components/subscription-form-fields';
import { useCreateSubscription } from '@/features/subscriptions/hooks';
import { useNewSubscriptionModal } from '@/features/subscriptions/stores';

type NewSubscriptionModalProps = {
  categories: string[];
  collections: Omit<Collection, 'user_id'>[];
};

const DEFAULT_SUBSCRIPTION_AMOUNT = 10.0;

export default function NewSubscriptionModal({
  categories,
  collections,
}: NewSubscriptionModalProps) {
  const newSubscriptionModalState = useNewSubscriptionModal();

  const { createSubscription, isCreateSubscriptionLoading } =
    useCreateSubscription();

  const [selectedCollectionId] = useAtom(selectedCollectionIdAtom);
  const defaultCategory = categories[0];

  const form = useForm<z.infer<typeof CreateSubscriptionSchema>>({
    resolver: zodResolver(CreateSubscriptionSchema),
    defaultValues: {
      name: '',
      amount: DEFAULT_SUBSCRIPTION_AMOUNT,
      frequency: 'monthly',
      icon_ref: 'default',
      next_invoice: new Date(),
      send_alert: true,
    },
  });

  React.useEffect(() => {
    if (newSubscriptionModalState.state !== 'open') {
      return;
    }

    if (defaultCategory) {
      form.setValue('category', defaultCategory);
    }

    if (selectedCollectionId) {
      form.setValue('collection_id', selectedCollectionId);
    }
  }, [
    defaultCategory,
    form,
    newSubscriptionModalState.state,
    selectedCollectionId,
  ]);

  async function onSubmit(values: z.infer<typeof CreateSubscriptionSchema>) {
    await createSubscription(values);
    form.reset();
    newSubscriptionModalState.set('closed');
  }

  return (
    <Dialog
      onOpenChange={(open) => !open && newSubscriptionModalState.set('closed')}
      open={newSubscriptionModalState.state === 'open'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Subscription</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <SubscriptionFormFields
              categories={categories}
              collections={collections}
              form={form}
            />

            <DialogFooter>
              <Button isLoading={isCreateSubscriptionLoading} type="submit">
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
