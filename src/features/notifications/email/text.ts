import type { CollectionGroup, OverviewContent, ReminderContent } from '@/features/notifications/content';
import {
  getOverviewCopy,
  getReminderCopy,
  getSentForLine,
  getOverviewItemDetail,
  OVERVIEW_NOTE,
  REMINDER_NOTE,
} from '@/features/notifications/email/copy';
import { formatUsd, formatWeekdayDate, pluralize } from '@/features/notifications/format';

// Plain-text alternatives, written by hand rather than converted from HTML so
// lists stay readable in text-only clients.

const TEST_LINE = 'TEST: This is a test with sample data. No real subscriptions are included.';

function collectionLines<TItem>(
  groups: CollectionGroup<TItem>[],
  noun: string,
  formatItem: (item: TItem) => string,
): string[] {
  return groups.flatMap((group) => [
    '',
    `${group.collectionName} (${pluralize(group.itemCount, noun)} · ${formatUsd(group.subtotalCents)})`,
    ...group.items.map((item) => `  - ${formatItem(item)}`),
  ]);
}

function footerLines(reason: string, content: ReminderContent | OverviewContent, manageUrl: string): string[] {
  return ['', '---', `${reason} ${getSentForLine(content)}`, `Manage notifications: ${manageUrl}`];
}

export function renderReminderText(content: ReminderContent, manageUrl: string): string {
  const copy = getReminderCopy(content);

  return [
    'EverySub',
    '',
    copy.heading,
    copy.summary,
    ...(content.test ? ['', TEST_LINE] : []),
    ...collectionLines(
      content.collections,
      'charge',
      (item) => `${formatWeekdayDate(item.expectedDate)}: ${item.name}, ${formatUsd(item.amountCents)}`,
    ),
    '',
    REMINDER_NOTE,
    ...footerLines(
      'You’re getting this because a collection in EverySub sends renewal reminders to this address.',
      content,
      manageUrl,
    ),
  ].join('\n');
}

export function renderOverviewText(content: OverviewContent, manageUrl: string): string {
  const copy = getOverviewCopy(content);

  return [
    'EverySub',
    '',
    copy.heading,
    copy.summary,
    ...(content.test ? ['', TEST_LINE] : []),
    '',
    '',
    copy.previousTitle.toUpperCase(),
    copy.previousSummary,
    ...(content.previousMonth.itemCount === 0 ? ['', copy.previousEmpty] : []),
    ...collectionLines(
      content.previousMonth.collections,
      'invoice',
      (item) =>
        `${formatWeekdayDate(item.date)}: ${item.name}, ${formatUsd(item.amountCents)} (${getOverviewItemDetail(item, false)})`,
    ),
    '',
    '',
    copy.newTitle.toUpperCase(),
    copy.newSummary,
    ...(content.newMonth.itemCount === 0 ? ['', copy.newEmpty] : []),
    ...collectionLines(
      content.newMonth.collections,
      'invoice',
      (item) =>
        `${formatWeekdayDate(item.date)}: ${item.name}, ${formatUsd(item.amountCents)} (${getOverviewItemDetail(item, true)})`,
    ),
    '',
    OVERVIEW_NOTE,
    ...footerLines(
      'You’re getting this because a collection in EverySub sends monthly overviews to this address.',
      content,
      manageUrl,
    ),
  ].join('\n');
}
