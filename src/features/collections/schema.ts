import { z } from 'zod';

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
