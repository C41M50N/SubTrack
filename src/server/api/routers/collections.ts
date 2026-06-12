import {
  CreateCollectionInput,
  createCollection,
  DeleteCollectionInput,
  deleteCollection,
  EditCollectionTitleInput,
  editCollectionTitle,
  getCollections,
} from '@/features/collections/actions';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const collectionsRouter = createTRPCRouter({
  getCollections: protectedProcedure.query(async ({ ctx }) => {
    return await getCollections(ctx);
  }),

  createCollection: protectedProcedure
    .input(CreateCollectionInput)
    .mutation(async ({ ctx, input }) => {
      return await createCollection(ctx, input);
    }),

  editCollectionTitle: protectedProcedure
    .input(EditCollectionTitleInput)
    .mutation(async ({ ctx, input }) => {
      return await editCollectionTitle(ctx, input);
    }),

  deleteCollection: protectedProcedure
    .input(DeleteCollectionInput)
    .mutation(async ({ ctx, input }) => {
      return await deleteCollection(ctx, input);
    }),
});
