import { DataSchema } from "@/features/import-export";
import { deleteUser, updateUserInfo } from "@/lib/clerk";
import {
	createReminder,
	createTodoistAPI,
	getProjectName,
	getProjects,
} from "@/lib/todoist";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { parseJSON, sleep } from "@/utils";
import { z } from "zod";

export const mainRouter = createTRPCRouter({
	updateName: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input: name }) => {
			await updateUserInfo(ctx.user.id, name);
		}),

	getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
		return ctx.user;
	}),

	deleteUser: protectedProcedure.mutation(async ({ ctx }) => {
		await deleteUser(ctx.user.id);
	}),

	setTodoistAPIKey: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input: apikey }) => {
			await ctx.prisma.user.update({
				where: { id: ctx.user.id },
				data: { todoistAPIKey: apikey },
			});
		}),

	removeTodoistAPIKey: protectedProcedure.mutation(async ({ ctx }) => {
		await ctx.prisma.user.update({
			where: { id: ctx.user.id },
			data: { todoistAPIKey: "", todoistProjectId: "" },
		});
	}),

	getTodoistProjects: protectedProcedure.query(async ({ ctx }) => {
		const todoist = createTodoistAPI(ctx.user.todoistAPIKey);
		const projects = await getProjects(todoist);
		await sleep(1000);
		return projects;
	}),

	getTodoistProjectName: protectedProcedure.query(async ({ ctx }) => {
		const todoist = createTodoistAPI(ctx.user.todoistAPIKey);
		const project_name = await getProjectName(
			todoist,
			ctx.user.todoistProjectId,
		);
		return project_name;
	}),

	createTodoistReminder: protectedProcedure
		.input(
			z.object({
				title: z.string(),
				reminder_date: z.date(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const todoist = createTodoistAPI(ctx.user.todoistAPIKey);
			await createReminder(
				todoist,
				ctx.user.todoistProjectId,
				input.title,
				input.reminder_date,
			);
		}),

	setTodoistProject: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input: projectId }) => {
			await ctx.prisma.user.update({
				where: { id: ctx.user.id },
				data: { todoistProjectId: projectId },
			});
		}),

	getExportJSON: protectedProcedure
		.query(async ({ ctx }) => {
			const categoryList = await ctx.prisma.categoryList.findUnique({
				where: { user_id: ctx.user.id },
				select: { categories: true }
			})

			if (!categoryList) throw new Error("missing categoryList");
			
			const categories = categoryList.categories;

			const collections = await ctx.prisma.collection.findMany({
				where: {
					user_id: ctx.user.id,
				},
				select: {
					title: true,
					subscriptions: {
						select: {
							name: true,
							amount: true,
							frequency: true,
							category: true,
							next_invoice: true,
							last_invoice: true,
							icon_ref: true,
							send_alert: true,
						}
					}
				}
			});

			const data = {
				categories: categories,
				collections: collections,
			}

			return JSON.stringify(data, null, "\t");
		}),

	importData: protectedProcedure
		.input(z.object({ json: z.string(), overwrite: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const data = parseJSON(input.json, DataSchema);

			// handle categories
			if (input.overwrite) {
				await ctx.prisma.$transaction([
					// empty user's categories
					ctx.prisma.categoryList.update({
						where: { user_id: ctx.user.id },
						data: { categories: [] }
					}),

					// add categories from imported JSON
					ctx.prisma.categoryList.update({
						where: { user_id: ctx.user.id },
						data: { categories: data.categories }
					})
				])
			} else {
				// set user's categories as array of merged categories from existing and imported JSON
				const categoryList = await ctx.prisma.categoryList.findUnique({
					where: { user_id: ctx.user.id },
					select: { categories: true }
				})
	
				if (!categoryList) throw new Error("missing categoryList");
				
				const currentCategories = categoryList.categories;
	
				const allCategories = new Set([...currentCategories, ...data.categories])
	
				await ctx.prisma.categoryList.update({
					where: { user_id: ctx.user.id },
					data: { categories: Array.from(allCategories) }
				})
			}

			// handle collections and subscriptions
			const currentCollectionTitles = (await ctx.prisma.collection.findMany({
				where: {
					user_id: ctx.user.id
				},
				select: {
					title: true
				}
			})).map((col) => col.title);

			for (const collectionTitle of data.collections.map(col => col.title)) {
				// if there is a new collection title in the imported JSON,
				// then create the collection and add its subscriptions to the collection.
				if (!currentCollectionTitles.includes(collectionTitle)) {
					const { id: collectionId } = await ctx.prisma.collection.create({
						data: {
							user_id: ctx.user.id,
							title: collectionTitle,
						}
					})

					// biome-ignore lint/style/noNonNullAssertion: guaranteed to be non-null
					const subscriptions = data.collections.find(col => col.title === collectionTitle)!.subscriptions;
					await ctx.prisma.subscription.createMany({
						data: subscriptions.map(sub => ({
							user_id: ctx.user.id,
							collection_id: collectionId,
							...sub,
						}))
					})
				}

				// if there is a duplicate collection title in the imported JSON,
				// then add (or overwrite) subscriptions to the collection.
				if (currentCollectionTitles.includes(collectionTitle)) {
					const collection = await ctx.prisma.collection.findFirst({
						where: {
							user_id: ctx.user.id,
							title: collectionTitle,
						}
					})
					if (!collection) break;

					// biome-ignore lint/style/noNonNullAssertion: guaranteed to be non-null
					const subscriptions = data.collections.find(col => col.title === collectionTitle)!.subscriptions;

					if (input.overwrite) {
						await ctx.prisma.$transaction([
							// delete all existing subscriptions in collection
							ctx.prisma.subscription.deleteMany({
								where: {
									user_id: ctx.user.id,
									collection_id: collection.id,
								}
							}),

							// add subscriptions from imported JSON
							ctx.prisma.subscription.createMany({
								data: subscriptions.map(sub => ({
									user_id: ctx.user.id,
									collection_id: collection.id,
									...sub,
								}))
							})
						])
					} else {
						await ctx.prisma.subscription.createMany({
							data: subscriptions.map(sub => ({
								user_id: ctx.user.id,
								collection_id: collection.id,
								...sub,
							}))
						})
					}
				}
			}
		})
});
