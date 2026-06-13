import { z } from 'zod';
import dayjs from '@/lib/dayjs';
import type { AuthenticatedContext } from '@/server/api/trpc';

export const GetExportDataInput = z.object({
  format: z.enum(['csv', 'json']),
  collectionId: z.string().nullable(),
});

export default async function getExportData(
  ctx: AuthenticatedContext,
  input: z.infer<typeof GetExportDataInput>
) {
  const categoryList = await ctx.db.categoryList.findUnique({
    where: { user_id: ctx.session.user.id },
    select: { categories: true },
  });

  if (!categoryList) {
    throw new Error('missing categoryList');
  }

  const subscriptions = await ctx.db.subscription.findMany({
    where: input.collectionId
      ? {
          user_id: ctx.session.user.id,
          collection_id: input.collectionId,
        }
      : { user_id: ctx.session.user.id },
    include: {
      collection: {
        select: {
          title: true,
        },
      },
    },
  });

  const nullValue = input.format === 'json' ? null : '';
  const subs = subscriptions
    .map(({ id, user_id, collection_id, ...rest }) => rest)
    .map(({ collection, next_invoice, last_invoice, ...rest }) => ({
      ...rest,
      collection: collection.title,
      next_invoice: dayjs(next_invoice).format('MM/DD/YYYY'),
      last_invoice:
        last_invoice !== null
          ? dayjs(last_invoice).format('MM/DD/YYYY')
          : nullValue,
    }));

  return {
    categories: categoryList.categories,
    subscriptions: subs,
  };
}
