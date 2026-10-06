import {
  PREVIEW_MANAGE_URL,
  severalCollectionsReminderFixture,
} from '@/features/notifications/email/fixtures';
import {
  RenewalReminderEmail,
  type RenewalReminderEmailProps,
} from '@/features/notifications/email/renewal-reminder-email';

export default function RenewalReminderSeveralCollectionsPreview(
  props: RenewalReminderEmailProps,
) {
  return <RenewalReminderEmail {...props} />;
}

RenewalReminderSeveralCollectionsPreview.PreviewProps = {
  content: severalCollectionsReminderFixture,
  manageUrl: PREVIEW_MANAGE_URL,
} satisfies RenewalReminderEmailProps;
