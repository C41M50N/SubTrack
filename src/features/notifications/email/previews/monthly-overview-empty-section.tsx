import {
  PREVIEW_MANAGE_URL,
  overviewWithEmptySectionFixture,
} from '@/features/notifications/email/fixtures';
import {
  MonthlyOverviewEmail,
  type MonthlyOverviewEmailProps,
} from '@/features/notifications/email/monthly-overview-email';

export default function MonthlyOverviewEmptySectionPreview(
  props: MonthlyOverviewEmailProps,
) {
  return <MonthlyOverviewEmail {...props} />;
}

MonthlyOverviewEmptySectionPreview.PreviewProps = {
  content: overviewWithEmptySectionFixture,
  manageUrl: PREVIEW_MANAGE_URL,
} satisfies MonthlyOverviewEmailProps;
