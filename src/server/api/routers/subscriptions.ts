import {
	type Subscription,
	SubscriptionSchema,
	SubscriptionWithoutIdSchema,
} from "@/features/subscriptions/types";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const subscriptionsRouter = createTRPCRouter({
	createSubscription: protectedProcedure
		.input(SubscriptionWithoutIdSchema)
		.mutation(async ({ ctx, input }) => {
			console.log(
				`Creating new subscription for <${ctx.session.user.name}>: ${JSON.stringify(input)}`,
			);
			await ctx.prisma.subscription.create({
				data: {
					userId: ctx.session.user.id,
					...input,
				},
			});
		}),

	getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
		const raw_subs = await ctx.prisma.subscription.findMany({
			where: { userId: ctx.session.user.id },
		});
		return raw_subs.map((sub) => sub as Subscription);
	}),

	getSubscriptionsFromCollection: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input: collectionId }) => {
			const subs = await ctx.prisma.subscription.findMany({
				where: {
					collectionId: collectionId,
					userId: ctx.session.user.id,
				},
			});
			return subs.map((sub) => sub as Subscription);
		}),

	updateSubscription: protectedProcedure
		.input(SubscriptionSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.prisma.subscription.update({
				where: { id: input.id, userId: ctx.session.user.id },
				data: input,
			});
		}),

	deleteSubscription: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			await ctx.prisma.subscription.delete({
				where: { userId: ctx.session.user.id, id: input },
			});
		}),
});
