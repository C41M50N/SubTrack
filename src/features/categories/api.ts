import { createServerFn } from '@tanstack/react-start';

import { requireAuthMiddleware } from '@/features/auth/middleware';
import { createCategoryInputSchema, listCategoriesInputSchema } from '@/features/categories/schema';
import { createMyCategory, listMyCategories } from '@/features/categories/server';

export const listCategories = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .validator(listCategoriesInputSchema)
  .handler(async ({ context: { auth }, data }) => listMyCategories(auth.userId, data.collectionId));

export const createCategory = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(createCategoryInputSchema)
  .handler(async ({ context: { auth }, data }) => {
    return createMyCategory({
      userId: auth.userId,
      collectionId: data.collectionId,
      name: data.name,
    });
  });
