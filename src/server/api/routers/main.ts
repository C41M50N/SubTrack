import { deleteUser, updateUserInfo } from "@/lib/clerk";
import {
	createReminder,
	createTodoistAPI,
	getProjectName,
	getProjects,
} from "@/lib/todoist";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { sleep } from "@/utils";
import { z } from "zod";

export const mainRouter = createTRPCRouter({
	updateName: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input: name }) => {
			await updateUserInfo(ctx.user.id, name);
		}),

	getLicenseType: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.prisma.user.findUnique({
			where: { id: ctx.user.id },
			select: { license_type: true },
		});
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
});
