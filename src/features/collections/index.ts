import type { Collection as CollectionPrisma } from "@prisma/client";
import { z } from "zod";

export const CollectionSchema = z.object({
	id: z.string(),
	title: z.string(),
	user_id: z.string(),
});

export const CreateCollectionSchema = CollectionSchema.omit({
	id: true,
	user_id: true,
});

export type CollectionWithoutUserId = Omit<CollectionPrisma, "user_id">;
