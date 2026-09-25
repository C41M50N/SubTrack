import { createServerFn } from '@tanstack/react-start';

import { requireAuthMiddleware } from '@/features/auth/middleware';
import {
  createCollectionInputSchema,
  deleteCollectionInputSchema,
  duplicateCollectionInputSchema,
  renameCollectionInputSchema,
} from '@/features/collections/schema';
import {
  createMyCollection,
  deleteMyCollection,
  duplicateMyCollection,
  listMyCollections,
  renameMyCollection,
} from '@/features/collections/server';
import { withUserFacingErrors } from '@/lib/errors';

export const listCollections = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context: { auth } }) => listMyCollections(auth.userId));

export const createCollection = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(createCollectionInputSchema)
  .handler(async ({ context: { auth }, data }) => {
    return withUserFacingErrors('Failed to create collection', () =>
      createMyCollection({
        userId: auth.userId,
        name: data.name,
      }),
    );
  });

export const renameCollection = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(renameCollectionInputSchema)
  .handler(async ({ context: { auth }, data }) => {
    return withUserFacingErrors('Failed to rename collection', () =>
      renameMyCollection({
        userId: auth.userId,
        collectionId: data.collectionId,
        name: data.name,
      }),
    );
  });

export const duplicateCollection = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(duplicateCollectionInputSchema)
  .handler(async ({ context: { auth }, data }) => {
    return duplicateMyCollection({
      userId: auth.userId,
      collectionId: data.collectionId,
    });
  });

export const deleteCollection = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(deleteCollectionInputSchema)
  .handler(async ({ context: { auth }, data }) => {
    return deleteMyCollection({
      userId: auth.userId,
      collectionId: data.collectionId,
    });
  });
