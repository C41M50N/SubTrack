import type { OverviewContent } from '@/features/notifications/content';
import {
  getOverviewCopy,
  getSentForLine,
  getOverviewItemDetail,
  OVERVIEW_NOTE,
} from '@/features/notifications/email/copy';
import {
  CollectionBlock,
  EmailLayout,
  EmptySection,
  FooterText,
  ItemRow,
  Lead,
  ManageLink,
  Note,
  SectionHeading,
  TestBanner,
} from '@/features/notifications/email/layout';
import { formatWeekdayDate } from '@/features/notifications/format';

export type MonthlyOverviewEmailProps = {
  content: OverviewContent;
  manageUrl: string;
};

export function MonthlyOverviewEmail({
  content,
  manageUrl,
}: MonthlyOverviewEmailProps) {
  const copy = getOverviewCopy(content);
  const { previousMonth, newMonth } = content;

  return (
    <EmailLayout
      previewText={copy.previewText}
      heading={copy.heading}
      footer={
        <>
          <FooterText>
            You’re getting this because a collection in EverySub sends monthly
            overviews to this address. {getSentForLine(content)}
          </FooterText>
          <ManageLink href={manageUrl} />
        </>
      }
    >
      <Lead>{copy.summary}</Lead>
      {content.test ? <TestBanner /> : null}

      <SectionHeading
        title={copy.previousTitle}
        summary={copy.previousSummary}
      />
      {previousMonth.itemCount === 0 ? (
        <EmptySection>{copy.previousEmpty}</EmptySection>
      ) : null}
      {previousMonth.collections.map((group) => (
        <CollectionBlock
          key={group.collectionId}
          name={group.collectionName}
          itemCount={group.itemCount}
          subtotalCents={group.subtotalCents}
          noun="invoice"
        >
          {group.items.map((item) => (
            <ItemRow
              key={item.invoiceId}
              date={formatWeekdayDate(item.date)}
              name={item.name}
              amountCents={item.amountCents}
              tag={getOverviewItemDetail(item, false)}
            />
          ))}
        </CollectionBlock>
      ))}

      <SectionHeading title={copy.newTitle} summary={copy.newSummary} />
      {newMonth.itemCount === 0 ? (
        <EmptySection>{copy.newEmpty}</EmptySection>
      ) : null}
      {newMonth.collections.map((group) => (
        <CollectionBlock
          key={group.collectionId}
          name={group.collectionName}
          itemCount={group.itemCount}
          subtotalCents={group.subtotalCents}
          noun="invoice"
        >
          {group.items.map((item) => (
            <ItemRow
              key={
                item.source === 'recorded'
                  ? item.invoiceId
                  : `${item.subscriptionId}:${item.date}`
              }
              date={formatWeekdayDate(item.date)}
              name={item.name}
              amountCents={item.amountCents}
              tag={getOverviewItemDetail(item, true)}
            />
          ))}
        </CollectionBlock>
      ))}

      <Note>{OVERVIEW_NOTE}</Note>
    </EmailLayout>
  );
}
