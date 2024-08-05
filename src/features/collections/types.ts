import { z } from "zod"
import { Collection as CollectionPrisma } from "@prisma/client"

export const CollectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  userId: z.string(),
})

export const CreateCollectionSchema = CollectionSchema.omit({ id: true, userId: true })

export type CollectionWithoutUserId = Omit<CollectionPrisma, 'userId'>
