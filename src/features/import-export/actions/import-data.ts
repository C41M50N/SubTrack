import { z } from 'zod';
import type { AuthenticatedContext } from '@/server/api/trpc';
import { parseJSON } from '@/utils';
import { DataSchema } from '..';

export const ImportDataProps = z.object({
  json: z.string(),
  overwrite: z.boolean(),
});

function createSubscriptionsData(
  subscriptions: Array<{
    name: string;
    amount: number;
    frequency: string;
    category: string;
    next_invoice: string;
    last_invoice: string | null;
    icon_ref: string;
    send_alert: boolean;
    collection: string;
  }>,
  userId: string,
  collectionId: string
) {
  return subscriptions.map((sub) => {
    const { collection: _, ...subscriptionData } = sub;
    return {
      user_id: userId,
      collection_id: collectionId,
      ...subscriptionData,
    };
  });
}

export default async function importData(
  ctx: AuthenticatedContext,
  input: z.infer<typeof ImportDataProps>
) {
  const data = parseJSON(input.json, DataSchema);

  // handle categories
  let categoriesToSave = data.categories;

  if (!input.overwrite) {
    const categoryList = await ctx.db.categoryList.findUnique({
      where: { user_id: ctx.session.user.id },
      select: { categories: true },
    });

    if (!categoryList) {
      throw new Error('missing categoryList');
    }

    const allCategories = new Set([
      ...categoryList.categories,
      ...data.categories,
    ]);
    categoriesToSave = Array.from(allCategories);
  }

  await ctx.db.categoryList.update({
    where: { user_id: ctx.session.user.id },
    data: { categories: categoriesToSave },
  });

  // handle collections and subscriptions
  const existingCollections = await ctx.db.collection.findMany({
    where: { user_id: ctx.session.user.id },
    select: { id: true, title: true },
  });

  const existingCollectionMap = new Map(
    existingCollections.map((col) => [col.title, col.id])
  );

  // Group subscriptions by collection
  const subscriptionsByCollection = data.subscriptions.reduce(
    (acc, subscription) => {
      const existing = acc[subscription.collection] || [];
      acc[subscription.collection] = [...existing, subscription];
      return acc;
    },
    {} as Record<string, typeof data.subscriptions>
  );

  for (const [collectionTitle, subscriptions] of Object.entries(
    subscriptionsByCollection
  )) {
    const existingCollectionId = existingCollectionMap.get(collectionTitle);

    if (existingCollectionId) {
      // Handle existing collection
      if (input.overwrite) {
        await ctx.db.$transaction([
          ctx.db.subscription.deleteMany({
            where: {
              user_id: ctx.session.user.id,
              collection_id: existingCollectionId,
            },
          }),
          ctx.db.subscription.createMany({
            data: createSubscriptionsData(
              subscriptions,
              ctx.session.user.id,
              existingCollectionId
            ),
          }),
        ]);
      } else {
        await ctx.db.subscription.createMany({
          data: createSubscriptionsData(
            subscriptions,
            ctx.session.user.id,
            existingCollectionId
          ),
        });
      }
    } else {
      // Create new collection with subscriptions
      const { id: newCollectionId } = await ctx.db.collection.create({
        data: {
          user_id: ctx.session.user.id,
          title: collectionTitle,
        },
      });

      await ctx.db.subscription.createMany({
        data: createSubscriptionsData(
          subscriptions,
          ctx.session.user.id,
          newCollectionId
        ),
      });
    }
  }
}
