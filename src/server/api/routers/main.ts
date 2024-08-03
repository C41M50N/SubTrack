import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { sleep } from "@/lib/utils";
import {
  createReminder,
  createTodoistAPI,
  getProjectName,
  getProjects
} from "@/lib/todoist";

export const mainRouter = createTRPCRouter({
  updateName: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: name }) => {
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { name: name }
      })
    }),

  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.prisma.user.findUnique({ where: { id: ctx.session.user.id } })
    }),

  setTodoistAPIKey: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: apikey }) => {
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { todoistAPIKey: apikey }
      })
    }),

  removeTodoistAPIKey: protectedProcedure
    .mutation(async ({ ctx }) => {
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { todoistAPIKey: "", todoistProjectId: "" }
      })
    }),

  getTodoistProjects: protectedProcedure
    .query(async ({ ctx }) => {
      const todoist = createTodoistAPI(ctx.session.user.todoistAPIKey);
      const projects = await getProjects(todoist);
      await sleep(1000);
      return projects;
    }),

  getTodoistProjectName: protectedProcedure
    .query(async ({ ctx }) => {
      const todoist = createTodoistAPI(ctx.session.user.todoistAPIKey);
      const project_name = await getProjectName(todoist, ctx.session.user.todoistProjectId);
      return project_name;
    }),

  createTodoistReminder: protectedProcedure
    .input(z.object({
      title: z.string(),
      reminder_date: z.date()
    }))
    .mutation(async ({ ctx, input }) => {
      const todoist = createTodoistAPI(ctx.session.user.todoistAPIKey);
      await createReminder(todoist, ctx.session.user.todoistProjectId, input.title, input.reminder_date);
    }),

  setTodoistProject: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: projectId }) => {
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { todoistProjectId: projectId }
      })
    })
});
