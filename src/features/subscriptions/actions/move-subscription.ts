import type { z } from 'zod';
import type { AuthenticatedContext } from '@/server/api/trpc';
import { MoveSubscriptionSchema } from '..';

const MAX_SUBSCRIPTIONS = 300;

export default async function moveSubscription(
  ctx: AuthenticatedContext,
  input: z.infer<typeof MoveSubscriptionSchema>
) {
  const subscription = await ctx.db.subscription.findFirst({
    where: {
      id: input.subscriptionId,
      user_id: ctx.session.user.id,
    },
  });

  if (!subscription) {
    throw new Error('Subscription not found.');
  }

  if (subscription.collection_id === input.destinationCollectionId) {
    throw new Error('Subscription is already in that collection.');
  }

  const destinationCollection = await ctx.db.collection.findFirst({
    where: {
      id: input.destinationCollectionId,
      user_id: ctx.session.user.id,
    },
  });

  if (!destinationCollection) {
    throw new Error('Destination collection not found.');
  }

  const destinationCount = await ctx.db.subscription.count({
    where: {
      user_id: ctx.session.user.id,
      collection_id: input.destinationCollectionId,
    },
  });

  if (destinationCount + 1 > MAX_SUBSCRIPTIONS) {
    throw new Error(
      'You have reached your subscription limit for this collection. You can have at most 300 subscriptions at a time in a collection.'
    );
  }

  await ctx.db.subscription.update({
    where: { id: subscription.id },
    data: { collection_id: input.destinationCollectionId },
  });
}
