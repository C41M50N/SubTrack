import { z } from 'zod';

import { reminders } from '../reminders';

export const CreateTodoistReminderInput = z.object({
  title: z.string(),
  reminder_date: z.date(),
});

export async function createTodoistReminder(input: z.infer<typeof CreateTodoistReminderInput>) {
  await reminders.createReminder(input.title, input.reminder_date);
}
