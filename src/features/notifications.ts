import dayjs from 'dayjs';
import { WebhookClient } from 'discord.js';

import { env } from '@/env.mjs';

import type { Subscription } from './subscriptions';
import { frequencyToDisplayText } from './subscriptions/billing';
import type { SubscriptionFrequency } from './subscriptions/constants';
import { toMoneyString } from './subscriptions/money';

const SECONDS_PER_MILLISECOND = 1000;

class DiscordNotifications {
  private readonly client: WebhookClient;

  constructor(webhookUrl: string) {
    this.client = new WebhookClient({ url: webhookUrl });
  }

  async sendMonthlyReviewNotification(renewingSubs: Subscription[], renewedSubs: Subscription[]): Promise<void> {
    let message = `# ${dayjs().format('MMMM')} Subscriptions Review\n`;

    if (renewingSubs.length > 0) {
      message += '## Subscriptions Renewing This Month\n';
      const totalAmount = renewingSubs.reduce((sum, sub) => sum + sub.amount, 0);
      message += `**${toMoneyString(totalAmount)} from ${renewingSubs.length} subscriptions.**\n`;
      message += `${renewingSubs.map((sub) => `- ${sub.name} renewing on <t:${Math.floor(sub.next_invoice.getTime() / SECONDS_PER_MILLISECOND)}:R> (${toMoneyString(sub.amount)}/${frequencyToDisplayText(sub.frequency as SubscriptionFrequency)})`).join('\n')}\n`;
    }

    if (renewedSubs.length > 0) {
      message += '## Subscriptions Renewed Last Month\n';
      const totalAmount = renewedSubs.reduce((sum, sub) => sum + sub.amount, 0);
      message += `**${toMoneyString(totalAmount)} from ${renewedSubs.length} subscriptions.**\n`;
      message += `${renewedSubs.map((sub) => `- ${sub.name} renewed on <t:${Math.floor(sub.last_invoice!.getTime() / SECONDS_PER_MILLISECOND)}:R> (${toMoneyString(sub.amount)}/${frequencyToDisplayText(sub.frequency as SubscriptionFrequency)})`).join('\n')}`;
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
