import { render } from 'react-email';

import type { NotificationContent } from '@/features/notifications/content';
import {
  getOverviewCopy,
  getReminderCopy,
} from '@/features/notifications/email/copy';
import { MonthlyOverviewEmail } from '@/features/notifications/email/monthly-overview-email';
import { RenewalReminderEmail } from '@/features/notifications/email/renewal-reminder-email';
import {
  renderOverviewText,
  renderReminderText,
} from '@/features/notifications/email/text';

export type RenderedEmail = {
  subject: string;
  previewText: string;
  html: string;
  text: string;
};

/** Renders a notification as a subject, HTML body, and plain-text alternative. */
export async function renderNotificationEmail(
  content: NotificationContent,
  options: { manageUrl: string },
): Promise<RenderedEmail> {
  if (content.kind === 'renewal_reminder') {
    const copy = getReminderCopy(content);

    return {
      subject: copy.subject,
      previewText: copy.previewText,
      html: await render(
        <RenewalReminderEmail
          content={content}
          manageUrl={options.manageUrl}
        />,
      ),
      text: renderReminderText(content, options.manageUrl),
    };
  }

  const copy = getOverviewCopy(content);

  return {
    subject: copy.subject,
    previewText: copy.previewText,
    html: await render(
      <MonthlyOverviewEmail content={content} manageUrl={options.manageUrl} />,
    ),
    text: renderOverviewText(content, options.manageUrl),
  };
}
