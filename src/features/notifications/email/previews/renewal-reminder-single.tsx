import {
  PREVIEW_MANAGE_URL,
  singleReminderFixture,
} from '@/features/notifications/email/fixtures';
import {
  RenewalReminderEmail,
  type RenewalReminderEmailProps,
} from '@/features/notifications/email/renewal-reminder-email';

export default function RenewalReminderSinglePreview(
  props: RenewalReminderEmailProps,
) {
  return <RenewalReminderEmail {...props} />;
}

RenewalReminderSinglePreview.PreviewProps = {
  content: singleReminderFixture,
  manageUrl: PREVIEW_MANAGE_URL,
} satisfies RenewalReminderEmailProps;
