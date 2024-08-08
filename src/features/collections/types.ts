import type { Collection as CollectionPrisma } from "@prisma/client";
import { z } from "zod";

export const CollectionSchema = z.object({
	id: z.string(),
	title: z.string(),
	userId: z.string(),
});

export const CreateCollectionSchema = CollectionSchema.omit({
	id: true,
	userId: true,
});

export type CollectionWithoutUserId = Omit<CollectionPrisma, "userId">;
