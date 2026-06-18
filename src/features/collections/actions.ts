import { z } from 'zod';

import type { AuthenticatedContext } from '@/server/api/trpc';

const MAX_COLLECTIONS = 50;
const MIN_COLLECTIONS = 1;

export const CreateCollectionInput = z.object({
  collectionTitle: z.string(),
});

export const EditCollectionTitleInput = z.object({
  collection_id: z.string(),
  title: z.string(),
});

export const DeleteCollectionInput = z.object({
  collectionId: z.string(),
});

export async function getCollections(ctx: AuthenticatedContext) {
  return await ctx.db.collection.findMany({
    where: { user_id: ctx.session.user.id },
    select: { id: true, title: true },
  });
}

export async function createCollection(ctx: AuthenticatedContext, input: z.infer<typeof CreateCollectionInput>) {
  const currentNumCollections = await ctx.db.collection.count({
    where: { user_id: ctx.session.user.id },
  });

  if (currentNumCollections >= MAX_COLLECTIONS) {
    throw new Error('You have reached your collections limit. You can have at most 50 collections at a time.');
  }

  await ctx.db.collection.create({
    data: {
      user_id: ctx.session.user.id,
      title: input.collectionTitle,
    },
  });
}

export async function editCollectionTitle(ctx: AuthenticatedContext, input: z.infer<typeof EditCollectionTitleInput>) {
  await ctx.db.collection.update({
    where: {
      id: input.collection_id,
      user_id: ctx.session.user.id,
    },
    data: {
      title: input.title,
    },
  });
}

export async function deleteCollection(ctx: AuthenticatedContext, input: z.infer<typeof DeleteCollectionInput>) {
  const count = await ctx.db.collection.count({
    where: { user_id: ctx.session.user.id },
  });

  if (count === MIN_COLLECTIONS) {
    throw new Error('You must keep at least one collection');
  }

  await ctx.db.collection.delete({
    where: {
      id: input.collectionId,
      user_id: ctx.session.user.id,
    },
  });
}
