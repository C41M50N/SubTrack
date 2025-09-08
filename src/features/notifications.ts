import { WebhookClient } from 'discord.js';
import { env } from '@/env.mjs';

class DiscordNotifications {
  private readonly client: WebhookClient;

  constructor(webhookUrl: string) {
    this.client = new WebhookClient({ url: webhookUrl });
  }

  async sendNotification(message: string): Promise<void> {
    try {
      await this.client.send({ content: message });
    } catch (error) {
      console.error('Error sending Discord notification:', error);
      throw new Error('Error sending Discord notification');
    }
  }
}

export const notifications = new DiscordNotifications(env.DISCORD_WEBHOOK_URL);
