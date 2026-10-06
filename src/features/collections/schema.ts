import { z } from 'zod';

/** The collection new accounts start with. */
export const INITIAL_COLLECTION_NAME = 'Personal';

export const LAST_COLLECTION_DELETE_MESSAGE = 'You can’t delete your only collection. Create another collection first.';

export const collectionNameSchema = z.string().trim().min(1, 'Name is required').max(100);

export const collectionIdInputSchema = z.object({
  collectionId: z.string().min(1),
});

export const createCollectionInputSchema = z.object({
  name: collectionNameSchema,
});

export const renameCollectionInputSchema = z.object({
  collectionId: z.string().min(1),
  name: collectionNameSchema,
});

export const duplicateCollectionInputSchema = collectionIdInputSchema;

export const deleteCollectionInputSchema = collectionIdInputSchema;
