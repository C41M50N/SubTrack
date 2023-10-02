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
      console.log(`Creating new subscription for <${ctx.session.user.name}>`)
      await ctx.prisma.subscription.create({ data: { ...input, userId: ctx.session.user.id } })
    }),

  getSubscriptions: protectedProcedure
    .query(async ({ ctx }) => {
      const raw_subs =  (await ctx.prisma.subscription.findMany({
        where: { userId: ctx.session.user.id }
      }))
      await sleep(5000)
      return raw_subs.map((sub) => sub as Subscription)
    }),

  updateSubscription: protectedProcedure
    .input(SubscriptionSchemaWithId)
    .mutation(async ({ ctx, input }) => {
      await sleep(1000)
      await ctx.prisma.subscription.update({ where: { id: input.id, userId: ctx.session.user.id }, data: input })
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
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { categories: input }
      })
    }),
});
