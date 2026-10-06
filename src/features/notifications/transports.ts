import { createHash } from 'node:crypto';

import type { NotificationContent } from '@/features/notifications/content';
import { classifyWebhookResult, type SendResult } from '@/features/notifications/delivery-policy';
import { buildDiscordMessage } from '@/features/notifications/discord-message';
import { renderNotificationEmail } from '@/features/notifications/email/render';
import { postToWebhook } from '@/features/notifications/http';
import { sendNotificationEmail } from '@/features/notifications/resend';
import { buildSignatureHeaders, getUnexpiredSecrets } from '@/features/notifications/signing';
import { buildWebhookPayload } from '@/features/notifications/webhook-payload';
import type { NotificationDestinationType, RetiredSigningSecret } from '@/lib/db/notification-schema';

const USER_AGENT = 'EverySub-Notifications/1.0';

export type DeliveryDestination = {
  id: string;
  type: NotificationDestinationType;
  name: string;
  webhookUrl: string | null;
  signingSecret: string | null;
  retiredSigningSecrets: RetiredSigningSecret[];
};

export type PreparedDelivery = {
  /**
   * Identifies the exact request body. A retry with unchanged content reuses
   * it; content changed by privacy or routing choices gets a new one.
   */
  requestKey: string;
  send: () => Promise<SendResult>;
};

function hash(...parts: string[]): string {
  return createHash('sha256').update(parts.join('\u0000')).digest('hex').slice(0, 32);
}

/** Secrets that should sign a request: the current one, plus rotated ones still in their grace period. */
export function getActiveSigningSecrets(destination: DeliveryDestination, now: Date): string[] {
  return [
    ...(destination.signingSecret ? [destination.signingSecret] : []),
    ...getUnexpiredSecrets(destination.retiredSigningSecrets, now).map((entry) => entry.secret),
  ];
}

/**
 * Renders a notification for one destination. Rendering happens before each
 * attempt, so every attempt reflects the latest eligible content.
 */
export async function prepareDelivery(input: {
  destination: DeliveryDestination;
  content: NotificationContent;
  /** The account's current verified email, for email destinations. */
  recipientEmail: string | null;
  manageUrl: string;
  now: () => Date;
}): Promise<PreparedDelivery> {
  const { destination, content } = input;

  if (destination.type === 'email') {
    const recipient = input.recipientEmail;
    const email = await renderNotificationEmail(content, { manageUrl: input.manageUrl });
    const requestKey = hash(recipient ?? '', email.subject, email.html, email.text);

    return {
      requestKey,
      send: async () =>
        recipient
          ? sendNotificationEmail({
              to: recipient,
              subject: email.subject,
              html: email.html,
              text: email.text,
              idempotencyKey: `everysub/${content.eventId}/${requestKey}`,
              kind: content.test ? 'test' : content.kind,
            })
          : { outcome: 'temporary_failure', message: 'The account email isn’t verified.' },
    };
  }

  const url = destination.webhookUrl;

  if (!url) {
    throw new Error('Webhook destination has no URL');
  }

  const body = JSON.stringify(
    destination.type === 'discord'
      ? buildDiscordMessage(content)
      : buildWebhookPayload(content, { id: destination.id, name: destination.name }),
  );
  const type = destination.type;

  return {
    requestKey: hash(body),
    send: async () => {
      const headers: Record<string, string> = { 'content-type': 'application/json', 'user-agent': USER_AGENT };

      if (type === 'webhook') {
        Object.assign(
          headers,
          buildSignatureHeaders({
            id: content.eventId,
            timestamp: Math.floor(input.now().getTime() / 1000),
            body,
            secrets: getActiveSigningSecrets(destination, input.now()),
          }),
          { 'x-everysub-event-type': content.kind },
        );
      }

      return classifyWebhookResult(await postToWebhook({ url, body, headers }), type);
    },
  };
}
