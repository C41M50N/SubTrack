import { number, z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { sleep } from "@/lib/utils"
import { Subscription, SubscriptionSchema, SubscriptionSchemaWithId } from "@/lib/types";
import { TodoistColors, createReminder, createTodoistAPI, getProjectName, getProjects } from "@/lib/todoist";

export const mainRouter = createTRPCRouter({
  createSubscription: protectedProcedure
    .input(SubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      console.log(`Creating new subscription for <${ctx.session.user.name}>: ${JSON.stringify(input)}`)
      await ctx.prisma.subscription.create({ data: { userId: ctx.session.user.id, ...input } })
    }),

  getSubscriptions: protectedProcedure
    .query(async ({ ctx }) => {
      const raw_subs =  (await ctx.prisma.subscription.findMany({
        where: { userId: ctx.session.user.id }
      }))
      await sleep(1000)
      return raw_subs.map((sub) => sub as Subscription)
    }),

  updateSubscription: protectedProcedure
    .input(SubscriptionSchemaWithId)
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.subscription.update({ where: { id: input.id, userId: ctx.session.user.id }, data: input })
      await sleep(1000)
    }),

  deleteSubscription: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.subscription.delete({ where: { userId: ctx.session.user.id, id: input } })
    }),

  getCategories: protectedProcedure
    .query(async ({ ctx }) => {
      return (await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { categories: true }
      }))?.categories
    }),

  setCategories: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input }) => {
      //? you can't remove categories that are in use
      const count = await ctx.prisma.subscription.count({
        where: {
          userId: ctx.session.user.id,
          category: {
            in: input
          }
        }
      })

      if (count > 0) {
        await ctx.prisma.user.update({
          where: { id: ctx.session.user.id },
          data: { categories: input }
        })
      } else {
        throw Error("Some categories you deleted are still in use.")
      }
    }),

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
        data: { todoistAPIKey: "" }
      })
    }),

  getTodoistProjects: protectedProcedure
    .query(async ({ ctx }) => {
      const todoist = createTodoistAPI(ctx.session.user.todoistAPIKey);
      const projects = await getProjects(todoist);
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
