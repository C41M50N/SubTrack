import { CreateTodoistReminderInput, createTodoistReminder } from '@/features/reminders/actions';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const mainRouter = createTRPCRouter({
  createTodoistReminder: protectedProcedure.input(CreateTodoistReminderInput).mutation(async ({ input }) => {
    return await createTodoistReminder(input);
  }),
});
