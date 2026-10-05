import {
  PREVIEW_MANAGE_URL,
  longOverviewFixture,
} from '@/features/notifications/email/fixtures';
import {
  MonthlyOverviewEmail,
  type MonthlyOverviewEmailProps,
} from '@/features/notifications/email/monthly-overview-email';

export default function MonthlyOverviewLongPreview(
  props: MonthlyOverviewEmailProps,
) {
  return <MonthlyOverviewEmail {...props} />;
}

MonthlyOverviewLongPreview.PreviewProps = {
  content: longOverviewFixture,
  manageUrl: PREVIEW_MANAGE_URL,
} satisfies MonthlyOverviewEmailProps;
