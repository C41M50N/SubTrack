import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const collectionsRouter = createTRPCRouter({
	getCollections: protectedProcedure.query(async ({ ctx }) => {
		const collections = await ctx.prisma.collection.findMany({
			where: { userId: ctx.session.user.id },
			select: { id: true, title: true },
		});
		return collections;
	}),

	createCollection: protectedProcedure
		.input(z.object({ collectionTitle: z.string() }))
		.mutation(async ({ ctx, input }) => {
			let maxNumCollections: number = Number.POSITIVE_INFINITY;
			switch (ctx.session.user.licenseType) {
				case "FREE":
					maxNumCollections = 1;
					break;

				case "BASIC":
					maxNumCollections = 2;
					break;

				case "PRO":
					maxNumCollections = 15;
					break;
			}

			const currentNumCollections = await ctx.prisma.collection.count({
				where: { userId: ctx.session.user.id },
			});

			if (currentNumCollections + 1 > maxNumCollections) {
				throw new Error(
					"You have reached your collections limit. Upgrade your license in order to add more collections.",
				);
			}

			await ctx.prisma.collection.create({
				data: {
					userId: ctx.session.user.id,
					title: input.collectionTitle,
				},
			});
		}),

	editCollectionTitle: protectedProcedure
		.input(
			z.object({
				collection_id: z.string(),
				title: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.prisma.collection.update({
				where: {
					id: input.collection_id,
					userId: ctx.session.user.id,
				},
				data: {
					title: input.title,
				},
			});
		}),

	deleteCollection: protectedProcedure
		.input(z.object({ collectionId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const count = await ctx.prisma.collection.count();
			if (count === 1) {
				throw new Error("You must keep at least one collection");
			}

			await ctx.prisma.collection.delete({
				where: {
					id: input.collectionId,
					userId: ctx.session.user.id,
				},
			});
		}),
});
