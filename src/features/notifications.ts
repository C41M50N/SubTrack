/** biome-ignore-all lint/style/noNonNullAssertion: <explanation> */
import dayjs from 'dayjs';
import { WebhookClient } from 'discord.js';
import { env } from '@/env.mjs';
import { toMoneyString } from '@/utils';
import type { SubscriptionFrequency } from './common';
import type { Subscription } from './subscriptions';
import { frequencyToDisplayText } from './subscriptions/utils';

class DiscordNotifications {
  private readonly client: WebhookClient;

  constructor(webhookUrl: string) {
    this.client = new WebhookClient({ url: webhookUrl });
  }

  async sendMonthlyReviewNotification(
    renewedSubs: Subscription[],
    renewingSubs: Subscription[]
  ): Promise<void> {
    let message = `# ${dayjs().format('MMMM')} Subscriptions Review\n`;

    if (renewingSubs.length > 0) {
      message += `## Subscriptions Renewing This Month
      ${renewingSubs.map((sub) => `- ${sub.name} renewing on <t:${Math.floor(sub.next_invoice.getTime() / 1000)}:R> (${toMoneyString(sub.amount)}/${frequencyToDisplayText(sub.frequency as SubscriptionFrequency)})`).join('\n')}\n`;
    }

    if (renewedSubs.length > 0) {
      message += `## Subscriptions Renewed Last Month
      ${renewedSubs.map((sub) => `- ${sub.name} renewed on <t:${Math.floor(sub.last_invoice!.getTime() / 1000)}:R> (${toMoneyString(sub.amount)}/${frequencyToDisplayText(sub.frequency as SubscriptionFrequency)})`).join('\n')}`;
    }

    try {
      await this.client.send({ content: message });
    } catch (error) {
      console.error('Error sending Discord notification:', error);
      throw new Error('Error sending Discord notification');
    }
  }
}

export const notifications = new DiscordNotifications(env.DISCORD_WEBHOOK_URL);
