import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const categoriesRouter = createTRPCRouter({
	getCategories: protectedProcedure.query(async ({ ctx }) => {
		const categoryList = await ctx.db.categoryList.findUnique({
			where: { user_id: ctx.session.user.id },
			select: { categories: true },
		});

		if (!categoryList) throw new Error("missing categoryList");

		return categoryList.categories;
	}),

	setCategories: protectedProcedure
		.input(z.array(z.string()))
		.mutation(async ({ ctx, input: categories }) => {
			const numAllSubscriptions = await ctx.db.subscription.count({
				where: {
					user_id: ctx.session.user.id,
				},
			});

			const numValidSubscriptions = await ctx.db.subscription.count({
				where: {
					user_id: ctx.session.user.id,
					category: {
						in: categories,
					},
				},
			});

			const diff = numAllSubscriptions - numValidSubscriptions;
			if (diff !== 0) {
				throw Error(
					"Some categories you attempted to delete are still in use. Delete all subscriptions that use the category you are trying to remove.",
				);
			}

			await ctx.db.categoryList.update({
				where: { user_id: ctx.session.user.id },
				data: { categories: categories },
			});
		}),
});
