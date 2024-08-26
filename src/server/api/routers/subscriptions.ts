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
				`Creating new subscription for <${ctx.user.name}>: ${JSON.stringify(input)}`,
			);

			let maxNumSubscriptions: number = Number.POSITIVE_INFINITY;
			switch (ctx.user.license_type) {
				case "FREE":
					maxNumSubscriptions = 10;
					break;

				case "BASIC":
					maxNumSubscriptions = 50;
					break;
			}

			const currentNumSubscriptions = await ctx.prisma.subscription.count({
				where: {
					user_id: ctx.user.id,
					collection_id: input.collection_id,
				},
			});

			if (currentNumSubscriptions + 1 > maxNumSubscriptions) {
				throw new Error(
					"You have reached your subscription limit for this collection. Upgrade your license in order to add more subscriptions.",
				);
			}

			await ctx.prisma.subscription.create({
				data: {
					user_id: ctx.user.id,
					...input,
					amount: Math.floor(input.amount * 100),
				},
			});
		}),

	getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
		const raw_subs = await ctx.prisma.subscription.findMany({
			where: { user_id: ctx.user.id },
		});
		return raw_subs.map((sub) => sub as Subscription);
	}),

	getSubscriptionsFromCollection: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input: collectionId }) => {
			const subs = await ctx.prisma.subscription.findMany({
				where: {
					collection_id: collectionId,
					user_id: ctx.user.id,
				},
			});
			return subs.map((sub) => sub as Subscription);
		}),

	updateSubscription: protectedProcedure
		.input(SubscriptionSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.prisma.subscription.update({
				where: { id: input.id, user_id: ctx.user.id },
				data: { ...input, amount: input.amount * 100 },
			});
		}),

	deleteSubscription: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			await ctx.prisma.subscription.delete({
				where: { user_id: ctx.user.id, id: input },
			});
		}),
});
