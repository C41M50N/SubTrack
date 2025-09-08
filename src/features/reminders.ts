import { TodoistApi } from '@doist/todoist-api-typescript';
import dayjs from 'dayjs';
import { env } from '@/env.mjs';

class TodoistReminders {
  private readonly api: TodoistApi;
  private readonly targetProjectId: string;

  constructor(apiKey: string, targetProjectId: string) {
    this.api = new TodoistApi(apiKey);
    this.targetProjectId = targetProjectId;
  }

  async createReminder(title: string, reminderDate: Date): Promise<void> {
    try {
      await this.api.addTask({
        content: `Cancel ${title} subscription`,
        description: 'This task was created by SubTrack.',
        priority: 1,
        dueDate: dayjs(reminderDate).format('YYYY-MM-DD'),
        projectId: this.targetProjectId,
      });
    } catch (error) {
      console.error('Error creating Todoist reminder:', error);
      throw new Error('Error creating Todoist reminder');
    }
  }
}

export const reminders = new TodoistReminders(
  env.TODOIST_API_KEY,
  env.TODOIST_PROJECT_ID
);
