import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const categoriesRouter = createTRPCRouter({
	getCategories: protectedProcedure.query(async ({ ctx }) => {
		const categoryList = await ctx.prisma.categoryList.findUnique({
			where: { user_id: ctx.user.id },
			select: { categories: true }
		})

		if (!categoryList) throw new Error("missing categoryList");

		return categoryList.categories;
	}),

	setCategories: protectedProcedure
		.input(z.array(z.string()))
		.mutation(async ({ ctx, input: categories }) => {
			const numAllSubscriptions = await ctx.prisma.subscription.count({
				where: {
					user_id: ctx.user.id,
				},
			});

			const numValidSubscriptions = await ctx.prisma.subscription.count({
				where: {
					user_id: ctx.user.id,
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

			await ctx.prisma.categoryList.update({
				where: { user_id: ctx.user.id },
				data: { categories: categories }
			});
		}),
});
