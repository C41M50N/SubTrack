import type { AuthenticatedContext } from '@/server/api/trpc';

export default async function createJSONExport(ctx: AuthenticatedContext) {
  const categoryList = await ctx.db.categoryList.findUnique({
    where: { user_id: ctx.session.user.id },
    select: { categories: true },
  });

  if (!categoryList) {
    throw new Error('missing categoryList');
  }

  const categories = categoryList.categories;

  const collections = await ctx.db.collection.findMany({
    where: {
      user_id: ctx.session.user.id,
    },
    select: {
      title: true,
      subscriptions: {
        select: {
          name: true,
          amount: true,
          frequency: true,
          category: true,
          next_invoice: true,
          last_invoice: true,
          icon_ref: true,
          send_alert: true,
        },
      },
    },
  });

  const data = {
    categories,
    collections,
  };

  return JSON.stringify(data, null, '\t');
}
