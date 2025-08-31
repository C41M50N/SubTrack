import { z } from 'zod';
import type { AuthenticatedContext } from '@/server/api/trpc';
import { parseJSON } from '@/utils';
import { DataSchema } from '..';

export const ImportDataProps = z.object({
  json: z.string(),
  overwrite: z.boolean(),
});

export default async function importData(
  ctx: AuthenticatedContext,
  input: z.infer<typeof ImportDataProps>
) {
  const data = parseJSON(input.json, DataSchema);

  // handle categories
  if (input.overwrite) {
    await ctx.db.$transaction([
      // empty user's categories
      ctx.db.categoryList.update({
        where: { user_id: ctx.session.user.id },
        data: { categories: [] },
      }),

      // add categories from imported JSON
      ctx.db.categoryList.update({
        where: { user_id: ctx.session.user.id },
        data: { categories: data.categories },
      }),
    ]);
  } else {
    // set user's categories as array of merged categories from existing and imported JSON
    const categoryList = await ctx.db.categoryList.findUnique({
      where: { user_id: ctx.session.user.id },
      select: { categories: true },
    });

    if (!categoryList) throw new Error('missing categoryList');

    const currentCategories = categoryList.categories;

    const allCategories = new Set([...currentCategories, ...data.categories]);

    await ctx.db.categoryList.update({
      where: { user_id: ctx.session.user.id },
      data: { categories: Array.from(allCategories) },
    });
  }

  // handle collections and subscriptions
  const currentCollectionTitles = (
    await ctx.db.collection.findMany({
      where: {
        user_id: ctx.session.user.id,
      },
      select: {
        title: true,
      },
    })
  ).map((col) => col.title);

  for (const collectionTitle of data.collections.map((col) => col.title)) {
    // if there is a new collection title in the imported JSON,
    // then create the collection and add its subscriptions to the collection.
    if (!currentCollectionTitles.includes(collectionTitle)) {
      const { id: collectionId } = await ctx.db.collection.create({
        data: {
          user_id: ctx.session.user.id,
          title: collectionTitle,
        },
      });

      // biome-ignore lint/style/noNonNullAssertion: guaranteed to be non-null
      const subscriptions = data.collections.find(
        (col) => col.title === collectionTitle
      )!.subscriptions;
      await ctx.db.subscription.createMany({
        data: subscriptions.map((sub) => ({
          user_id: ctx.session.user.id,
          collection_id: collectionId,
          ...sub,
        })),
      });
    }

    // if there is a duplicate collection title in the imported JSON,
    // then add (or overwrite) subscriptions to the collection.
    if (currentCollectionTitles.includes(collectionTitle)) {
      const collection = await ctx.db.collection.findFirst({
        where: {
          user_id: ctx.session.user.id,
          title: collectionTitle,
        },
      });
      if (!collection) break;

      // biome-ignore lint/style/noNonNullAssertion: guaranteed to be non-null
      const subscriptions = data.collections.find(
        (col) => col.title === collectionTitle
      )!.subscriptions;

      if (input.overwrite) {
        await ctx.db.$transaction([
          // delete all existing subscriptions in collection
          ctx.db.subscription.deleteMany({
            where: {
              user_id: ctx.session.user.id,
              collection_id: collection.id,
            },
          }),

          // add subscriptions from imported JSON
          ctx.db.subscription.createMany({
            data: subscriptions.map((sub) => ({
              user_id: ctx.session.user.id,
              collection_id: collection.id,
              ...sub,
            })),
          }),
        ]);
      } else {
        await ctx.db.subscription.createMany({
          data: subscriptions.map((sub) => ({
            user_id: ctx.session.user.id,
            collection_id: collection.id,
            ...sub,
          })),
        });
      }
    }
  }
}
