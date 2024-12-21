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

			const maxNumSubscriptions: number = 300;

			const currentNumSubscriptions = await ctx.db.subscription.count({
				where: {
					user_id: ctx.session.user.id,
					collection_id: input.collection_id,
				},
			});

			if (currentNumSubscriptions + 1 > maxNumSubscriptions) {
				throw new Error(
					"You have reached your subscription limit for this collection. You can have at most 300 subscriptions at a time in a collection.",
				);
			}

			await ctx.db.subscription.create({
				data: {
					user_id: ctx.session.user.id,
					...input,
					amount: Math.floor(input.amount * 100),
				},
			});
		}),

	getSubscriptionsFromCollection: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input: collectionId }) => {
			const subs = await ctx.db.subscription.findMany({
				where: {
					collection_id: collectionId,
					user_id: ctx.session.user.id,
				},
			});
			return subs.map((sub) => sub as Subscription);
		}),

	updateSubscription: protectedProcedure
		.input(SubscriptionSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.subscription.update({
				where: { id: input.id, user_id: ctx.session.user.id },
				data: { ...input, amount: input.amount * 100 },
			});
		}),

	deleteSubscription: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			await ctx.db.subscription.delete({
				where: { user_id: ctx.session.user.id, id: input },
			});
		}),
});
