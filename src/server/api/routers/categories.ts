import {
  getCategories,
  SetCategoriesInput,
  setCategories,
} from '@/features/categories/actions';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const categoriesRouter = createTRPCRouter({
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    return await getCategories(ctx);
  }),

  setCategories: protectedProcedure
    .input(SetCategoriesInput)
    .mutation(async ({ ctx, input: categories }) => {
      return await setCategories(ctx, categories);
    }),
});
