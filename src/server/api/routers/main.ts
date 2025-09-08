import { z } from 'zod';
import { reminders } from '@/features/reminders';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const mainRouter = createTRPCRouter({
  createTodoistReminder: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        reminder_date: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      await reminders.createReminder(input.title, input.reminder_date);
    }),
});
