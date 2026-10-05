import type {
  NewMonthItem,
  OverviewContent,
  RecordedInvoiceItem,
  ReminderContent,
} from '@/features/notifications/content';
import { formatMonth, formatMonthName, formatUsd, formatWeekdayDate, pluralize } from '@/features/notifications/format';

// Wording shared by the HTML and plain-text emails. Every line says "expected"
// or "recorded" so nothing reads as a confirmed payment.

const TEST_SUBJECT_PREFIX = '[Test] ';

function latestExpectedDate(content: ReminderContent): string {
  return content.collections
    .flatMap((group) => group.items.map((item) => item.expectedDate))
    .reduce((latest, date) => (date > latest ? date : latest), content.localDate);
}

function onlyReminderItem(content: ReminderContent) {
  return content.itemCount === 1 ? content.collections[0]?.items[0] : undefined;
}

export function getReminderCopy(content: ReminderContent) {
  const single = onlyReminderItem(content);
  const latest = formatWeekdayDate(latestExpectedDate(content));
  const prefix = content.test ? TEST_SUBJECT_PREFIX : '';

  if (single) {
    const date = formatWeekdayDate(single.expectedDate);

    return {
      subject: `${prefix}${single.name} is expected to renew on ${date}`,
      previewText: `${formatUsd(single.amountCents)} expected on ${date}. EverySub hasn’t confirmed this charge.`,
      heading: `${single.name} is expected to renew soon`,
      summary: `${formatUsd(single.amountCents)} is expected on ${date}.`,
    };
  }

  const collectionCount = content.collections.length;

  return {
    subject: `${prefix}${pluralize(content.itemCount, 'subscription')} expected to renew by ${latest}`,
    previewText: `${formatUsd(content.totalCents)} expected across ${pluralize(content.itemCount, 'charge')}${
      collectionCount > 1 ? ` in ${pluralize(collectionCount, 'collection')}` : ''
    }. EverySub hasn’t confirmed these charges.`,
    heading: `${pluralize(content.itemCount, 'subscription')} expected to renew soon`,
    summary: `${formatUsd(content.totalCents)} is expected across ${pluralize(content.itemCount, 'charge')} through ${latest}.`,
  };
}

export const REMINDER_NOTE =
  'Dates and amounts are expected from your EverySub schedule. EverySub doesn’t confirm payments or cancel subscriptions; check with each provider if something looks wrong.';

export function getOverviewCopy(content: OverviewContent) {
  const month = formatMonth(content.newMonth.month);
  const monthName = formatMonthName(content.newMonth.month);
  const previousName = formatMonthName(content.previousMonth.month);

  return {
    subject: `${content.test ? TEST_SUBJECT_PREFIX : ''}Your ${month} subscription schedule`,
    previewText: `${previousName}’s recorded charges and ${monthName}’s expected schedule.`,
    heading: `Your ${month} subscription schedule`,
    summary: `Here’s what EverySub recorded in ${previousName} and what’s expected in ${monthName}.`,
    previousTitle: `${formatMonth(content.previousMonth.month)} · Recorded scheduled charges`,
    previousSummary:
      content.previousMonth.itemCount === 0
        ? 'Nothing recorded'
        : `${pluralize(content.previousMonth.itemCount, 'invoice')} · ${formatUsd(content.previousMonth.subtotalCents)}`,
    previousEmpty: `No scheduled charges were recorded in ${previousName}.`,
    newTitle: `${month} · Expected schedule`,
    newSummary:
      content.newMonth.itemCount === 0
        ? 'Nothing expected'
        : `${pluralize(content.newMonth.itemCount, 'invoice')} · ${formatUsd(content.newMonth.subtotalCents)} · ${content.newMonth.recordedCount} recorded, ${content.newMonth.projectedCount} projected`,
    newEmpty: `Nothing is expected in ${monthName}.`,
  };
}

export const OVERVIEW_NOTE =
  'Recorded charges are snapshots of your schedule taken as each date came due. Projected charges use each active subscription’s current schedule. Neither is a confirmed payment.';

export function getSentForLine(content: ReminderContent | OverviewContent): string {
  return `Scheduled for 9:00 AM on ${formatWeekdayDate(content.localDate)} (${content.timeZone}).`;
}

export const RECORDED_TAG = 'Recorded';
export const PROJECTED_TAG = 'Projected';

/**
 * The secondary line for an overview item: its category, as recorded on the
 * invoice for recorded items, plus whether a new-month item is recorded or
 * projected.
 */
export function getOverviewItemDetail(item: RecordedInvoiceItem | NewMonthItem, showSource: boolean): string {
  return showSource ? `${item.source === 'recorded' ? RECORDED_TAG : PROJECTED_TAG} · ${item.category}` : item.category;
}
