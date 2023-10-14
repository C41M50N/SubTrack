import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { sleep } from "@/lib/utils"
import { Subscription, SubscriptionSchema, SubscriptionSchemaWithId } from "@/lib/types";

export const mainRouter = createTRPCRouter({
  createSubscription: protectedProcedure
    .input(SubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      console.log(`Creating new subscription for <${ctx.session.user.name}>: ${JSON.stringify(input)}`)
      await ctx.prisma.subscription.create({ data: { userId: ctx.session.user.id, ...input } })
    }),

  getSubscriptions: protectedProcedure
    .query(async ({ ctx }) => {
      const raw_subs =  (await ctx.prisma.subscription.findMany({
        where: { userId: ctx.session.user.id }
      }))
      await sleep(1000)
      return raw_subs.map((sub) => sub as Subscription)
    }),

  updateSubscription: protectedProcedure
    .input(SubscriptionSchemaWithId)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.subscription.update({ where: { id: input.id, userId: ctx.session.user.id }, data: input })
      await sleep(1000)
    }),

  deleteSubscription: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.subscription.delete({ where: { userId: ctx.session.user.id, id: input } })
    }),

  getCategories: protectedProcedure
    .query(async ({ ctx }) => {
      return (await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { categories: true }
      }))?.categories
    }),

  setCategories: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input }) => {
      //? you can't remove categories that are in use
      const count = await ctx.prisma.subscription.count({
        where: {
          userId: ctx.session.user.id,
          category: {
            in: input
          }
        }
      })

      if (count > 0) {
        await ctx.prisma.user.update({
          where: { id: ctx.session.user.id },
          data: { categories: input }
        })
      } else {
        throw Error("Some categories you deleted are still in use.")
      }
    }),

  updateName: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: name }) => {
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { name: name }
      })
    })
});
