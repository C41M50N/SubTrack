import { describe, expect, it } from 'vitest';

import {
  buildOverviewContent,
  buildReminderContent,
  isContentEmpty,
  type NewMonthItem,
  type NotificationContent,
  type ProjectedInvoiceItem,
  type RecordedInvoiceItem,
  type ReminderItem,
} from '@/features/notifications/content';
import { buildDiscordMessage, type DiscordMessage } from '@/features/notifications/discord-message';
import { renderNotificationEmail } from '@/features/notifications/email/render';
import { buildOverviewItems, listDueReminderOccurrences } from '@/features/notifications/schedule';
import { getDueReminderSlot, getOverviewPeriod } from '@/features/notifications/time';
import { buildWebhookPayload } from '@/features/notifications/webhook-payload';

const TIME_ZONE = 'America/New_York';
const LONG_AGO = new Date('2026-01-01T00:00:00Z');
const destination = { id: 'dest-1', name: 'Home server' };
const collectionNames = new Map([
  ['personal', 'Personal'],
  ['work', 'Work'],
]);

function meta(localDate: string) {
  return {
    eventId: 'evt_test',
    test: false,
    timeZone: TIME_ZONE,
    localDate,
    scheduledFor: new Date(`${localDate}T13:00:00Z`),
  };
}

function reminderItem(overrides: Partial<ReminderItem> = {}): ReminderItem {
  return {
    subscriptionId: 'sub-video',
    collectionId: 'personal',
    name: 'Streamline Video',
    iconRef: 'example.com',
    expectedDate: '2026-10-07',
    amountCents: 1599,
    ...overrides,
  };
}

function recordedItem(overrides: Partial<RecordedInvoiceItem> = {}): RecordedInvoiceItem {
  return {
    source: 'recorded',
    invoiceId: 'inv-oct',
    subscriptionId: 'sub-video',
    collectionId: 'personal',
    name: 'Streamline Video',
    iconRef: 'example.com',
    category: 'Streaming',
    date: '2026-10-01',
    amountCents: 1599,
    ...overrides,
  };
}

function projectedItem(overrides: Partial<ProjectedInvoiceItem> = {}): ProjectedInvoiceItem {
  return {
    source: 'projected',
    subscriptionId: 'sub-music',
    collectionId: 'work',
    name: 'Tunebox Family',
    iconRef: 'example.com',
    category: 'Music',
    date: '2026-10-12',
    amountCents: 1699,
    ...overrides,
  };
}

function reminder(items: ReminderItem[], names: ReadonlyMap<string, string> = collectionNames) {
  return buildReminderContent({ meta: meta('2026-10-04'), leadDays: 3, items, collectionNames: names });
}

function overview(
  previousItems: RecordedInvoiceItem[],
  newMonthItems: NewMonthItem[],
  names: ReadonlyMap<string, string> = collectionNames,
) {
  return buildOverviewContent({
    meta: meta('2026-10-01'),
    month: '2026-10',
    previousMonth: '2026-09',
    previousItems,
    newMonthItems,
    collectionNames: names,
  });
}

/** One deleted subscription's invoice last month, then one recorded and one projected item. */
function smallOverview() {
  return overview(
    [
      recordedItem({
        invoiceId: 'inv-sep',
        subscriptionId: null,
        name: 'Daily Grind News',
        category: 'News',
        date: '2026-09-10',
        amountCents: 499,
      }),
    ],
    [recordedItem(), projectedItem()],
  );
}

/** Every format a destination can receive, as text. */
async function renderEverywhere(content: NotificationContent) {
  const email = await renderNotificationEmail(content, { manageUrl: 'https://everysub.example/settings' });

  return {
    webhook: JSON.stringify(buildWebhookPayload(content, destination)),
    discord: JSON.stringify(buildDiscordMessage(content)),
    emailSubject: email.subject,
    emailPreview: email.previewText,
    emailHtml: email.html,
    emailText: email.text,
  };
}

describe('payload filtering', () => {
  it('keeps an excluded subscription out of every reminder format and total', async () => {
    const now = new Date('2026-10-04T13:00:00Z');
    const base = {
      collectionId: 'personal',
      iconRef: 'example.com',
      status: 'active' as const,
      costFrequency: 'monthly' as const,
      nextInvoiceDate: '2026-10-07',
      remindersEligibleAt: LONG_AGO,
    };
    const occurrences = listDueReminderOccurrences({
      subscriptions: [
        { ...base, id: 'kept', name: 'Included Service', costAmount: 1000, notificationsIncluded: true },
        {
          ...base,
          id: 'sub-private-excluded',
          name: 'Private Excluded Service',
          costAmount: 9900,
          notificationsIncluded: false,
        },
      ],
      routes: [{ collectionId: 'personal', createdAt: LONG_AGO }],
      timing: { timeZone: TIME_ZONE, leadDays: 3, timingChangedAt: LONG_AGO },
      slotDate: getDueReminderSlot(now, TIME_ZONE).date,
      now,
    });
    const content = buildReminderContent({
      meta: meta('2026-10-04'),
      leadDays: 3,
      items: occurrences,
      collectionNames,
    });
    const formats = await renderEverywhere(content);

    expect(content.totalCents).toBe(1000);

    for (const rendered of Object.values(formats)) {
      expect(rendered).not.toMatch(/Private Excluded Service|sub-private-excluded|99\.00|9900/);
    }

    for (const rendered of [formats.webhook, formats.discord, formats.emailHtml, formats.emailText]) {
      expect(rendered).toContain('Included Service');
    }

    for (const rendered of [formats.discord, formats.emailHtml, formats.emailText]) {
      expect(rendered).toContain('$10.00');
    }
  });

  it('keeps excluded invoices and unrouted collections out of every overview format and total', async () => {
    const period = getOverviewPeriod('2026-10', TIME_ZONE);
    const invoice = {
      subscriptionId: null,
      iconRef: 'example.com',
      category: 'Streaming',
      invoiceDate: '2026-09-10',
    };
    const { previousItems, newMonthItems } = buildOverviewItems({
      period,
      collectionIds: new Set(['personal']),
      invoices: [
        {
          ...invoice,
          id: 'inv-kept',
          collectionId: 'personal',
          name: 'Kept Snapshot',
          amount: 1200,
          notificationsIncluded: true,
        },
        {
          ...invoice,
          id: 'inv-hidden',
          collectionId: 'personal',
          name: 'Excluded Snapshot',
          amount: 4400,
          notificationsIncluded: false,
        },
        {
          ...invoice,
          id: 'inv-work',
          collectionId: 'work',
          name: 'Unrouted Work Snapshot',
          amount: 5500,
          notificationsIncluded: true,
        },
      ],
      subscriptions: [],
    });
    const content = buildOverviewContent({
      meta: meta('2026-10-01'),
      month: period.month,
      previousMonth: period.previousMonth,
      previousItems,
      newMonthItems,
      collectionNames,
    });
    const formats = await renderEverywhere(content);

    expect(content.previousMonth).toMatchObject({ itemCount: 1, subtotalCents: 1200 });

    for (const rendered of Object.values(formats)) {
      expect(rendered).not.toMatch(/Excluded Snapshot|Unrouted Work Snapshot|inv-hidden|inv-work|44\.00|55\.00/);
    }

    for (const rendered of [formats.webhook, formats.discord, formats.emailHtml, formats.emailText]) {
      expect(rendered).toContain('Kept Snapshot');
    }

    for (const rendered of [formats.discord, formats.emailHtml, formats.emailText]) {
      expect(rendered).toContain('$12.00');
    }
  });
});

describe('generic webhook payload', () => {
  it('describes a reminder with stable IDs, dates, and cents', () => {
    const content = reminder([
      reminderItem(),
      reminderItem({
        subscriptionId: 'sub-ci',
        collectionId: 'work',
        name: 'Shipyard CI',
        expectedDate: '2026-10-06',
        amountCents: 2900,
      }),
    ]);

    expect(buildWebhookPayload(content, destination)).toEqual({
      schemaVersion: 1,
      id: 'evt_test',
      type: 'renewal_reminder',
      test: false,
      destination: { id: 'dest-1', name: 'Home server' },
      schedule: { localDate: '2026-10-04', timeZone: TIME_ZONE, scheduledFor: '2026-10-04T13:00:00.000Z' },
      data: {
        leadDays: 3,
        currency: 'USD',
        itemCount: 2,
        totalExpectedAmountCents: 4499,
        collections: [
          {
            id: 'personal',
            name: 'Personal',
            itemCount: 1,
            subtotalExpectedAmountCents: 1599,
            items: [
              {
                subscriptionId: 'sub-video',
                collectionId: 'personal',
                name: 'Streamline Video',
                expectedInvoiceDate: '2026-10-07',
                expectedAmountCents: 1599,
                currency: 'USD',
              },
            ],
          },
          {
            id: 'work',
            name: 'Work',
            itemCount: 1,
            subtotalExpectedAmountCents: 2900,
            items: [
              {
                subscriptionId: 'sub-ci',
                collectionId: 'work',
                name: 'Shipyard CI',
                expectedInvoiceDate: '2026-10-06',
                expectedAmountCents: 2900,
                currency: 'USD',
              },
            ],
          },
        ],
      },
    });
  });

  it('describes an overview with invoice IDs for recorded items and subscription IDs for projections', () => {
    expect(buildWebhookPayload(smallOverview(), destination)).toEqual({
      schemaVersion: 1,
      id: 'evt_test',
      type: 'monthly_overview',
      test: false,
      destination: { id: 'dest-1', name: 'Home server' },
      schedule: { localDate: '2026-10-01', timeZone: TIME_ZONE, scheduledFor: '2026-10-01T13:00:00.000Z' },
      data: {
        currency: 'USD',
        previousMonth: {
          month: '2026-09',
          basis: 'recorded_scheduled_invoices',
          itemCount: 1,
          subtotalAmountCents: 499,
          collections: [
            {
              id: 'personal',
              name: 'Personal',
              itemCount: 1,
              subtotalAmountCents: 499,
              items: [
                {
                  invoiceId: 'inv-sep',
                  subscriptionId: null,
                  collectionId: 'personal',
                  name: 'Daily Grind News',
                  iconRef: 'example.com',
                  category: 'News',
                  invoiceDate: '2026-09-10',
                  amountCents: 499,
                  currency: 'USD',
                },
              ],
            },
          ],
        },
        newMonth: {
          month: '2026-10',
          basis: 'expected_schedule',
          itemCount: 2,
          recordedCount: 1,
          projectedCount: 1,
          subtotalExpectedAmountCents: 3298,
          collections: [
            {
              id: 'personal',
              name: 'Personal',
              itemCount: 1,
              subtotalExpectedAmountCents: 1599,
              items: [
                {
                  id: 'inv-oct',
                  source: 'recorded',
                  invoiceId: 'inv-oct',
                  subscriptionId: 'sub-video',
                  collectionId: 'personal',
                  name: 'Streamline Video',
                  iconRef: 'example.com',
                  category: 'Streaming',
                  date: '2026-10-01',
                  expectedAmountCents: 1599,
                  currency: 'USD',
                },
              ],
            },
            {
              id: 'work',
              name: 'Work',
              itemCount: 1,
              subtotalExpectedAmountCents: 1699,
              items: [
                {
                  id: 'sub-music:2026-10-12',
                  source: 'projected',
                  subscriptionId: 'sub-music',
                  collectionId: 'work',
                  name: 'Tunebox Family',
                  iconRef: 'example.com',
                  category: 'Music',
                  date: '2026-10-12',
                  expectedAmountCents: 1699,
                  currency: 'USD',
                },
              ],
            },
          ],
        },
      },
    });
  });
});

describe('Discord message', () => {
  // Discord's documented embed limits:
  // https://docs.discord.com/developers/resources/message#embed-limits
  function expectWithinDiscordLimits({ embeds }: DiscordMessage) {
    const characters = embeds.reduce(
      (total, embed) =>
        total +
        embed.title.length +
        embed.description.length +
        (embed.footer?.text.length ?? 0) +
        embed.fields.reduce((sum, field) => sum + field.name.length + field.value.length, 0),
      0,
    );

    // The 6,000-character limit applies to all embeds in a message combined.
    expect(characters).toBeLessThanOrEqual(6000);
    expect(embeds.length).toBeLessThanOrEqual(10);

    for (const embed of embeds) {
      expect(embed.title.length).toBeLessThanOrEqual(256);
      expect(embed.description.length).toBeLessThanOrEqual(4096);
      expect(embed.footer?.text.length ?? 0).toBeLessThanOrEqual(2048);
      expect(embed.fields.length).toBeLessThanOrEqual(25);

      for (const field of embed.fields) {
        expect(field.name.length).toBeLessThanOrEqual(256);
        expect(field.value.length).toBeLessThanOrEqual(1024);
      }
    }
  }

  /** Items spread across many collections, with names long enough to overflow a message. */
  function manyItems<TItem extends { collectionId: string }>(count: number, build: (index: number) => TItem) {
    const items = Array.from({ length: count }, (_, index) => build(index));
    const names = new Map(items.map((item) => [item.collectionId, `Collection ${item.collectionId}`]));

    return { items, names };
  }

  it('never pings anyone and escapes markdown in names', () => {
    const message = buildDiscordMessage(reminder([reminderItem({ name: '@everyone **bold** `code`' })]));

    expect(message.allowed_mentions).toEqual({ parse: [] });
    expect(message.embeds[0].fields[0].value).toContain('@everyone \\*\\*bold\\*\\* \\`code\\`');
  });

  it('fits a long reminder within Discord’s limits while keeping full totals', () => {
    const { items, names } = manyItems(300, (index) =>
      reminderItem({
        subscriptionId: `sub-${index}`,
        collectionId: `collection-${index % 40}`,
        name: `Subscription with a fairly long descriptive name ${index}`,
        amountCents: 1000,
      }),
    );
    const message = buildDiscordMessage(reminder(items, names));

    expectWithinDiscordLimits(message);
    expect(message.embeds[0].description).toMatch(/300 expected charges.*\$3,000\.00/);
    expect(JSON.stringify(message)).toContain('Subscription with a fairly long descriptive name 0');
  });

  it('fits a long overview within Discord’s limits across all its embeds while keeping full totals', () => {
    const previous = manyItems(120, (index) =>
      recordedItem({
        invoiceId: `inv-sep-${index}`,
        collectionId: `collection-${index % 30}`,
        name: `Previous subscription with a fairly long descriptive name ${index}`,
        date: '2026-09-15',
        amountCents: 1000,
      }),
    );
    const upcoming = manyItems(180, (index) =>
      projectedItem({
        subscriptionId: `sub-${index}`,
        collectionId: `collection-${index % 30}`,
        name: `Upcoming subscription with a fairly long descriptive name ${index}`,
        amountCents: 1000,
      }),
    );
    const message = buildDiscordMessage(
      overview(previous.items, upcoming.items, new Map([...previous.names, ...upcoming.names])),
    );
    const descriptions = message.embeds.map((embed) => embed.description).join('\n');

    expectWithinDiscordLimits(message);
    expect(descriptions).toMatch(/120 invoices.*\$1,200\.00/);
    expect(descriptions).toMatch(/180 invoices.*\$1,800\.00/);
    expect(JSON.stringify(message)).toContain('Previous subscription with a fairly long descriptive name 0');
    expect(JSON.stringify(message)).toContain('Upcoming subscription with a fairly long descriptive name 0');
  });

  it('shows each overview item’s date, amount, and category, labeling new-month items recorded or projected', () => {
    const lines = buildDiscordMessage(smallOverview()).embeds.flatMap((embed) =>
      embed.fields.flatMap((field) => field.value.split('\n')),
    );

    expect(lines).toEqual([
      expect.stringMatching(/Sep 10.*Daily Grind News.*\$4\.99.*News/),
      expect.stringMatching(/Oct 1\b.*Streamline Video.*\$15\.99.*Recorded.*Streaming/),
      expect.stringMatching(/Oct 12.*Tunebox Family.*\$16\.99.*Projected.*Music/),
    ]);
  });
});

describe('content', () => {
  it('groups by collection name, then sorts items by date and name', () => {
    // Collection IDs, insertion order, and item names all disagree with the expected order.
    const content = reminder(
      [
        reminderItem({ subscriptionId: 'ci', collectionId: 'c-1', name: 'Shipyard CI', amountCents: 2900 }),
        reminderItem({ subscriptionId: 'a', collectionId: 'c-2', name: 'Alpha', expectedDate: '2026-10-07' }),
        reminderItem({ subscriptionId: 'z', collectionId: 'c-2', name: 'Zulu', expectedDate: '2026-10-05' }),
        reminderItem({ subscriptionId: 'm', collectionId: 'c-2', name: 'Mike', expectedDate: '2026-10-05' }),
      ],
      new Map([
        ['c-1', 'Work'],
        ['c-2', 'Personal'],
      ]),
    );

    expect(content.collections.map((group) => [group.collectionName, group.itemCount, group.subtotalCents])).toEqual([
      ['Personal', 3, 4797],
      ['Work', 1, 2900],
    ]);
    expect(content.collections[0].items.map((item) => item.name)).toEqual(['Mike', 'Zulu', 'Alpha']);
    expect(content).toMatchObject({ itemCount: 4, totalCents: 7697 });
  });

  it('treats an overview as empty only when both months are', () => {
    expect(isContentEmpty(overview([], []))).toBe(true);
    expect(isContentEmpty(overview([], [projectedItem()]))).toBe(false);
    expect(isContentEmpty(overview([recordedItem({ date: '2026-09-10' })], []))).toBe(false);
  });
});
