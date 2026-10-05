// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import {
  buildOverviewContent,
  buildReminderContent,
  type NewMonthItem,
  type NotificationContent,
  type RecordedInvoiceItem,
} from '@/features/notifications/content';
import { getOverviewCopy } from '@/features/notifications/email/copy';
import {
  longOverviewFixture,
  PREVIEW_MANAGE_URL,
} from '@/features/notifications/email/fixtures';
import { renderNotificationEmail } from '@/features/notifications/email/render';
import { formatUsd, formatWeekdayDate } from '@/features/notifications/format';

const collectionNames = new Map([
  ['personal', 'Personal'],
  ['work', 'Work'],
]);

function meta(localDate: string, test: boolean) {
  return {
    eventId: 'evt_email',
    test,
    timeZone: 'America/New_York',
    localDate,
    scheduledFor: new Date(`${localDate}T13:00:00Z`),
  };
}

function reminder(test = false) {
  return buildReminderContent({
    meta: meta('2026-10-04', test),
    leadDays: 3,
    collectionNames,
    items: [
      {
        subscriptionId: 'sub-video',
        collectionId: 'personal',
        name: 'Streamline Video',
        iconRef: 'example.com',
        expectedDate: '2026-10-07',
        amountCents: 1599,
      },
      {
        subscriptionId: 'sub-ci',
        collectionId: 'work',
        name: 'Shipyard CI',
        iconRef: 'example.com',
        expectedDate: '2026-10-06',
        amountCents: 2900,
      },
    ],
  });
}

const septemberInvoice: RecordedInvoiceItem = {
  source: 'recorded',
  invoiceId: 'inv-sep',
  subscriptionId: null,
  collectionId: 'personal',
  name: 'Daily Grind News',
  iconRef: 'example.com',
  category: 'News',
  date: '2026-09-10',
  amountCents: 499,
};

const octoberItems: NewMonthItem[] = [
  {
    source: 'recorded',
    invoiceId: 'inv-oct',
    subscriptionId: 'sub-video',
    collectionId: 'personal',
    name: 'Streamline Video',
    iconRef: 'example.com',
    category: 'Streaming',
    date: '2026-10-01',
    amountCents: 1599,
  },
  {
    source: 'projected',
    subscriptionId: 'sub-music',
    collectionId: 'personal',
    name: 'Tunebox Family',
    iconRef: 'example.com',
    category: 'Music',
    date: '2026-10-12',
    amountCents: 1699,
  },
];

function overview(
  previousItems: RecordedInvoiceItem[],
  newMonthItems: NewMonthItem[],
  test = false,
) {
  return buildOverviewContent({
    meta: meta('2026-10-01', test),
    month: '2026-10',
    previousMonth: '2026-09',
    previousItems,
    newMonthItems,
    collectionNames,
  });
}

const KINDS = [
  { kind: 'reminder', build: reminder },
  {
    kind: 'overview',
    build: (test: boolean) => overview([septemberInvoice], octoberItems, test),
  },
];

const render = (content: NotificationContent) =>
  renderNotificationEmail(content, { manageUrl: PREVIEW_MANAGE_URL });

/** The text of each innermost HTML table row, one entry per paragraph. */
function htmlRows(html: string): string[][] {
  const document = new DOMParser().parseFromString(html, 'text/html');

  return [...document.querySelectorAll('tr')]
    .filter((row) => !row.querySelector('tr'))
    .map((row) =>
      [...row.querySelectorAll('p')].map((element) => element.textContent),
    );
}

/** HTML rows for individual items, which end in their amount. */
function htmlItemRows(html: string): string[][] {
  return htmlRows(html).filter((row) =>
    /^\$[\d,]+\.\d{2}$/.test(row.at(-1) ?? ''),
  );
}

/** Plain-text list items, without their bullets. */
function textItems(text: string): string[] {
  return text
    .split('\n')
    .flatMap((line) => line.match(/^\s+- (.+)$/)?.[1] ?? []);
}

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Matches text that mentions each part, in order. */
const mentioning = (...parts: string[]) =>
  expect.stringMatching(new RegExp(parts.map(escapeRegExp).join('.*')));

describe('notification emails', () => {
  it('lists each reminder item’s date, name, and amount under its collection', async () => {
    const email = await render(reminder());

    expect(htmlRows(email.html)).toEqual([
      ['Personal', expect.stringContaining('$15.99')],
      ['Wed, Oct 7', 'Streamline Video', '$15.99'],
      ['Work', expect.stringContaining('$29.00')],
      ['Tue, Oct 6', 'Shipyard CI', '$29.00'],
    ]);
    expect(email.text).toMatch(
      /Personal.*\$15\.99.*\n.*Streamline Video[\s\S]*Work.*\$29\.00.*\n.*Shipyard CI/,
    );
    expect(textItems(email.text)).toEqual([
      mentioning('Wed, Oct 7', 'Streamline Video', '$15.99'),
      mentioning('Tue, Oct 6', 'Shipyard CI', '$29.00'),
    ]);
  });

  it('shows each overview item’s category and labels new-month items recorded or projected', async () => {
    const email = await render(overview([septemberInvoice], octoberItems));

    expect(htmlItemRows(email.html)).toEqual([
      ['Thu, Sep 10', 'Daily Grind News', 'News', '$4.99'],
      [
        'Thu, Oct 1',
        'Streamline Video',
        expect.stringMatching(/Recorded.*Streaming/),
        '$15.99',
      ],
      [
        'Mon, Oct 12',
        'Tunebox Family',
        expect.stringMatching(/Projected.*Music/),
        '$16.99',
      ],
    ]);
    expect(textItems(email.text)).toEqual([
      mentioning('Thu, Sep 10', 'Daily Grind News', '$4.99', 'News'),
      mentioning(
        'Thu, Oct 1',
        'Streamline Video',
        '$15.99',
        'Recorded',
        'Streaming',
      ),
      mentioning(
        'Mon, Oct 12',
        'Tunebox Family',
        '$16.99',
        'Projected',
        'Music',
      ),
    ]);
  });

  it('shows an empty state for whichever overview month has no items', async () => {
    const { previousEmpty, newEmpty } = getOverviewCopy(overview([], []));
    const noPrevious = await render(overview([], octoberItems));
    const noNew = await render(overview([septemberInvoice], []));

    for (const body of [noPrevious.html, noPrevious.text]) {
      expect(body).toContain(previousEmpty);
      expect(body).not.toContain(newEmpty);
    }

    for (const body of [noNew.html, noNew.text]) {
      expect(body).toContain(newEmpty);
      expect(body).not.toContain(previousEmpty);
    }

    expect(htmlItemRows(noPrevious.html)).toHaveLength(2);
    expect(htmlItemRows(noNew.html)).toHaveLength(1);
  });

  it('renders every item of a long overview as an HTML row and a text line', async () => {
    const email = await render(longOverviewFixture);
    const { previousMonth, newMonth } = longOverviewFixture;
    const items: NewMonthItem[] = [previousMonth, newMonth].flatMap(
      (section): NewMonthItem[] =>
        section.collections.flatMap((group) => group.items),
    );

    expect(items).toHaveLength(24);
    expect(htmlItemRows(email.html)).toEqual(
      items.map((item) => [
        formatWeekdayDate(item.date),
        item.name,
        expect.any(String),
        formatUsd(item.amountCents),
      ]),
    );
    expect(textItems(email.text)).toEqual(
      items.map((item) =>
        mentioning(
          formatWeekdayDate(item.date),
          item.name,
          formatUsd(item.amountCents),
        ),
      ),
    );
  });

  it.each(KINDS)(
    'labels a test $kind in its subject and both bodies',
    async ({ build }) => {
      const live = await render(build(false));
      const test = await render(build(true));

      for (const field of ['subject', 'html', 'text'] as const) {
        expect(test[field]).toMatch(/\btest\b/i);
        expect(live[field]).not.toMatch(/\btest\b/i);
      }
    },
  );

  it.each(KINDS)(
    'links only to notification settings from a $kind',
    async ({ build }) => {
      const email = await render(build(false));
      const links = [...email.html.matchAll(/href="([^"]+)"/g)].map(
        (match) => match[1],
      );

      expect(links).toEqual([PREVIEW_MANAGE_URL]);
      expect(email.text.match(/https?:\/\/\S+/g)).toEqual([PREVIEW_MANAGE_URL]);
    },
  );
});
