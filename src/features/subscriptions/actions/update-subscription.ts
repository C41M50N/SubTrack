import type { z } from 'zod';

import type { AuthenticatedContext } from '@/server/api/trpc';

import type { SubscriptionSchema } from '..';
import { toCents } from '../money';

export default async function updateSubscription(ctx: AuthenticatedContext, input: z.infer<typeof SubscriptionSchema>) {
  const collection = await ctx.db.collection.findFirst({
    where: {
      id: input.collection_id,
      user_id: ctx.session.user.id,
    },
    select: { id: true },
  });

  if (!collection) {
    throw new Error('Collection not found.');
  }

  await ctx.db.subscription.update({
    where: { id: input.id, user_id: ctx.session.user.id },
    data: { ...input, amount: toCents(input.amount) },
  });
}
