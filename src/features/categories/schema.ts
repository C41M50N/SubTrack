import { z } from 'zod';

export const categoryNameSchema = z.string().trim().min(1, 'Name is required').max(100);

export const listCategoriesInputSchema = z.object({
  collectionId: z.string().min(1),
});

export const createCategoryInputSchema = z.object({
  collectionId: z.string().min(1),
  name: categoryNameSchema,
});
