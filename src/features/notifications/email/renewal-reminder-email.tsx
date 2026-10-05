import type { ReminderContent } from '@/features/notifications/content';
import {
  getReminderCopy,
  getSentForLine,
  REMINDER_NOTE,
} from '@/features/notifications/email/copy';
import {
  CollectionBlock,
  EmailLayout,
  FooterText,
  ItemRow,
  Lead,
  ManageLink,
  Note,
  TestBanner,
} from '@/features/notifications/email/layout';
import { formatWeekdayDate } from '@/features/notifications/format';

export type RenewalReminderEmailProps = {
  content: ReminderContent;
  manageUrl: string;
};

export function RenewalReminderEmail({
  content,
  manageUrl,
}: RenewalReminderEmailProps) {
  const copy = getReminderCopy(content);

  return (
    <EmailLayout
      previewText={copy.previewText}
      heading={copy.heading}
      footer={
        <>
          <FooterText>
            You’re getting this because a collection in EverySub sends renewal
            reminders to this address. {getSentForLine(content)}
          </FooterText>
          <ManageLink href={manageUrl} />
        </>
      }
    >
      <Lead>{copy.summary}</Lead>
      {content.test ? <TestBanner /> : null}
      {content.collections.map((group) => (
        <CollectionBlock
          key={group.collectionId}
          name={group.collectionName}
          itemCount={group.itemCount}
          subtotalCents={group.subtotalCents}
          noun="charge"
        >
          {group.items.map((item) => (
            <ItemRow
              key={`${item.subscriptionId}:${item.expectedDate}`}
              date={formatWeekdayDate(item.expectedDate)}
              name={item.name}
              amountCents={item.amountCents}
            />
          ))}
        </CollectionBlock>
      ))}
      <Note>{REMINDER_NOTE}</Note>
    </EmailLayout>
  );
}
