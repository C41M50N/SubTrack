import { z } from 'zod';

import type { AuthenticatedContext } from '@/server/api/trpc';

export const SetCategoriesInput = z.array(z.string());

export async function getCategories(ctx: AuthenticatedContext) {
  const categoryList = await ctx.db.categoryList.findUnique({
    where: { user_id: ctx.session.user.id },
    select: { categories: true },
  });

  if (!categoryList) {
    throw new Error('missing categoryList');
  }

  return categoryList.categories;
}

export async function setCategories(ctx: AuthenticatedContext, categories: z.infer<typeof SetCategoriesInput>) {
  const numAllSubscriptions = await ctx.db.subscription.count({
    where: {
      user_id: ctx.session.user.id,
    },
  });

  const numValidSubscriptions = await ctx.db.subscription.count({
    where: {
      user_id: ctx.session.user.id,
      category: {
        in: categories,
      },
    },
  });

  const diff = numAllSubscriptions - numValidSubscriptions;
  if (diff !== 0) {
    throw new Error(
      'Some categories you attempted to delete are still in use. Delete all subscriptions that use the category you are trying to remove.',
    );
  }

  await ctx.db.categoryList.update({
    where: { user_id: ctx.session.user.id },
    data: { categories },
  });
}
