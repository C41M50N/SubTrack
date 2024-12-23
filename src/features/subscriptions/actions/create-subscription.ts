import type { AuthenticatedContext } from "@/server/api/trpc";
import type { z } from "zod";
import type { CreateSubscriptionSchema } from "..";

const MAX_SUBSCRIPTIONS = 300;

export default async function createSubscription(
	ctx: AuthenticatedContext,
	input: z.infer<typeof CreateSubscriptionSchema>,
) {
	const numOfSubscriptions = await ctx.db.subscription.count({
		where: {
			user_id: ctx.session.user.id,
			collection_id: input.collection_id,
		},
	});

	if (numOfSubscriptions + 1 > MAX_SUBSCRIPTIONS) {
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
}
