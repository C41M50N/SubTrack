import { z } from "zod"
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc"

export const collectionsRouter = createTRPCRouter({
  getCollections: protectedProcedure
    .query(async ({ ctx }) => {
      const collections = await ctx.prisma.collection.findMany({
        where: { userId: ctx.session.user.id },
        select: { id: true, title: true }
      })
      return collections
    }),
  
  createCollection: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: title }) => {
      await ctx.prisma.collection.create({
        data: {
          userId: ctx.session.user.id,
          title: title,
        }
      })
    }),

  editCollectionTitle: protectedProcedure
    .input(z.object({
      collection_id: z.string(),
      title: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.collection.update({
        where: {
          id: input.collection_id,
          userId: ctx.session.user.id,
        },
        data: {
          title: input.title
        }
      })
    }),

  deleteCollection: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: collection_id }) => {
      const count = await ctx.prisma.collection.count()
      if (count === 1) {
        throw new Error("You must keep at least collection")
      }

      await ctx.prisma.collection.delete({
        where: {
          id: collection_id,
          userId: ctx.session.user.id,
        }
      })
    }),
})
