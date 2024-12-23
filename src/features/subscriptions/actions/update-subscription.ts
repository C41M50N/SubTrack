import type { AuthenticatedContext } from "@/server/api/trpc";
import type { z } from "zod";
import type { SubscriptionSchema } from "..";

export default async function updateSubscription(
	ctx: AuthenticatedContext,
	input: z.infer<typeof SubscriptionSchema>,
) {
	await ctx.db.subscription.update({
		where: { id: input.id, user_id: ctx.session.user.id },
		data: { ...input, amount: input.amount * 100 },
	});
}
