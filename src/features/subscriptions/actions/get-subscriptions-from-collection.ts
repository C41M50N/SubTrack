import type { Subscription } from "@/features/subscriptions";
import type { AuthenticatedContext } from "@/server/api/trpc";
import { z } from "zod";

export const GetSubscriptionsFromCollectionProps = z.object({
	collectionId: z.string(),
});

export default async function getSubscriptionsFromCollection(
	ctx: AuthenticatedContext,
	input: z.infer<typeof GetSubscriptionsFromCollectionProps>,
) {
	const subs = await ctx.db.subscription.findMany({
		where: {
			collection_id: input.collectionId,
			user_id: ctx.session.user.id,
		},
	});
	return subs.map((sub) => sub as Subscription);
}
