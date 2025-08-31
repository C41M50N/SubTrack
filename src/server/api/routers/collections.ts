import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const collectionsRouter = createTRPCRouter({
  getCollections: protectedProcedure.query(async ({ ctx }) => {
    const collections = await ctx.db.collection.findMany({
      where: { user_id: ctx.session.user.id },
      select: { id: true, title: true },
    });
    return collections;
  }),

  createCollection: protectedProcedure
    .input(z.object({ collectionTitle: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const maxNumCollections: number = 50;

      const currentNumCollections = await ctx.db.collection.count({
        where: { user_id: ctx.session.user.id },
      });

      if (currentNumCollections + 1 > maxNumCollections) {
        throw new Error(
          'You have reached your collections limit. You can have at most 50 collections at a time.'
        );
      }

      await ctx.db.collection.create({
        data: {
          user_id: ctx.session.user.id,
          title: input.collectionTitle,
        },
      });
    }),

  editCollectionTitle: protectedProcedure
    .input(
      z.object({
        collection_id: z.string(),
        title: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.collection.update({
        where: {
          id: input.collection_id,
          user_id: ctx.session.user.id,
        },
        data: {
          title: input.title,
        },
      });
    }),

  deleteCollection: protectedProcedure
    .input(z.object({ collectionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.db.collection.count();
      if (count === 1) {
        throw new Error('You must keep at least one collection');
      }

      await ctx.db.collection.delete({
        where: {
          id: input.collectionId,
          user_id: ctx.session.user.id,
        },
      });
    }),
});
