import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const categoriesRouter = createTRPCRouter({
	getCategories: protectedProcedure.query(async ({ ctx }) => {
		return (
			(
				await ctx.prisma.user.findUnique({
					where: { id: ctx.session.user.id },
					select: { categories: true },
				})
			)?.categories || []
		);
	}),

	setCategories: protectedProcedure
		.input(z.array(z.string()))
		.mutation(async ({ ctx, input: categories }) => {
			const numAllSubscriptions = await ctx.prisma.subscription.count({
				where: {
					userId: ctx.session.user.id,
				},
			});

			const numValidSubscriptions = await ctx.prisma.subscription.count({
				where: {
					userId: ctx.session.user.id,
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

			await ctx.prisma.user.update({
				where: { id: ctx.session.user.id },
				data: { categories: categories },
			});
		}),
});
