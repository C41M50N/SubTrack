import { z } from 'zod';
import type { AuthenticatedContext } from '@/server/api/trpc';

export const DeleteSubscriptionProps = z.object({
  subscriptionId: z.string(),
});

export default async function deleteSubscription(
  ctx: AuthenticatedContext,
  input: z.infer<typeof DeleteSubscriptionProps>
) {
  await ctx.db.subscription.delete({
    where: {
      id: input.subscriptionId,
      user_id: ctx.session.user.id,
    },
  });
}
