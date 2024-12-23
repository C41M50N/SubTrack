import {
	CreateSubscriptionSchema,
	SubscriptionSchema,
} from "@/features/subscriptions";
import createSubscription from "@/features/subscriptions/actions/create-subscription";
import deleteSubscription, {
	DeleteSubscriptionProps,
} from "@/features/subscriptions/actions/delete-subscription";
import getSubscriptionsFromCollection, {
	GetSubscriptionsFromCollectionProps,
} from "@/features/subscriptions/actions/get-subscriptions-from-collection";
import updateSubscription from "@/features/subscriptions/actions/update-subscription";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const subscriptionsRouter = createTRPCRouter({
	createSubscription: protectedProcedure
		.input(CreateSubscriptionSchema)
		.mutation(async ({ ctx, input }) => {
			return await createSubscription(ctx, input);
		}),

	getSubscriptionsFromCollection: protectedProcedure
		.input(GetSubscriptionsFromCollectionProps)
		.query(async ({ ctx, input }) => {
			return await getSubscriptionsFromCollection(ctx, input);
		}),

	updateSubscription: protectedProcedure
		.input(SubscriptionSchema)
		.mutation(async ({ ctx, input }) => {
			return await updateSubscription(ctx, input);
		}),

	deleteSubscription: protectedProcedure
		.input(DeleteSubscriptionProps)
		.mutation(async ({ ctx, input }) => {
			return await deleteSubscription(ctx, input);
		}),
});
