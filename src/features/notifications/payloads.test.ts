import { describe, expect, it } from 'vitest';

import { buildOverviewContent, buildReminderContent, isContentEmpty } from '@/features/notifications/content';
import { buildDiscordMessage, DISCORD_LIMITS, escapeDiscordText } from '@/features/notifications/discord-message';
import { renderNotificationEmail } from '@/features/notifications/email/render';
import { buildSampleOverview, buildSampleReminder } from '@/features/notifications/samples';
import { buildOverviewItems, listDueReminderOccurrences } from '@/features/notifications/schedule';
import { getDueReminderSlot, getOverviewPeriod } from '@/features/notifications/time';
import { buildWebhookPayload, WEBHOOK_SCHEMA_VERSION } from '@/features/notifications/webhook-payload';

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

/** Every format a destination can receive, as text, for leak checks. */
async function renderEverywhere(content: Parameters<typeof buildWebhookPayload>[0]) {
  const email = await renderNotificationEmail(content, { manageUrl: 'https://everysub.example/settings' });

  return [
    JSON.stringify(buildWebhookPayload(content, destination)),
    JSON.stringify(buildDiscordMessage(content)),
    email.subject,
    email.previewText,
    email.html,
    email.text,
  ];
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

    expect(content.totalCents).toBe(1000);

    for (const rendered of await renderEverywhere(content)) {
      expect(rendered).not.toContain('Private Excluded Service');
      expect(rendered).not.toContain('sub-private-excluded');
      expect(rendered).not.toContain('99.00');
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

    expect(content.previousMonth).toMatchObject({ itemCount: 1, subtotalCents: 1200 });

    for (const rendered of await renderEverywhere(content)) {
      expect(rendered).not.toMatch(/Excluded Snapshot|Unrouted Work Snapshot|inv-hidden|inv-work/);
    }
  });
});

describe('generic webhook payload', () => {
  it('describes a reminder with stable IDs, cents, and currency', () => {
    const content = buildSampleReminder({
      eventId: 'evt_1',
      test: false,
      timeZone: TIME_ZONE,
      localDate: '2026-10-04',
      itemCount: 2,
    });
    const payload = buildWebhookPayload(content, destination);

    expect(payload).toMatchObject({
      schemaVersion: WEBHOOK_SCHEMA_VERSION,
      id: 'evt_1',
      type: 'renewal_reminder',
      test: false,
      destination,
      schedule: { localDate: '2026-10-04', timeZone: TIME_ZONE, scheduledFor: '2026-10-04T13:00:00.000Z' },
    });
    expect(payload.data).toMatchObject({ leadDays: 3, currency: 'USD', itemCount: 2, totalExpectedAmountCents: 3298 });

    const [firstCollection] = 'collections' in payload.data ? payload.data.collections : [];

    expect(firstCollection.items[0]).toEqual({
      subscriptionId: expect.any(String),
      collectionId: firstCollection.id,
      name: expect.any(String),
      expectedInvoiceDate: expect.stringMatching(/^2026-10-0\d$/),
      expectedAmountCents: expect.any(Number),
      currency: 'USD',
    });
  });

  it('separates recorded and projected new-month items', () => {
    const content = buildSampleOverview({ eventId: 'evt_2', test: false, timeZone: TIME_ZONE, month: '2026-10' });
    const payload = buildWebhookPayload(content, destination);

    if (!('newMonth' in payload.data)) {
      throw new Error('Expected an overview payload');
    }

    const items = payload.data.newMonth.collections.flatMap((group) => group.items);
    const recorded = items.find((item) => item.source === 'recorded');
    const projected = items.find((item) => item.source === 'projected');

    expect(recorded).toMatchObject({ id: recorded?.invoiceId, invoiceId: expect.any(String) });
    expect(projected).toMatchObject({ id: `${projected?.subscriptionId}:${projected?.date}` });
    expect(projected).not.toHaveProperty('invoiceId');
    expect(payload.data.previousMonth.basis).toBe('recorded_scheduled_invoices');
    expect(payload.data.newMonth).toMatchObject({ recordedCount: 1, projectedCount: 5 });
  });
});

describe('Discord message', () => {
  it('never pings anyone and escapes markdown in names', () => {
    const content = buildReminderContent({
      meta: meta('2026-10-04'),
      leadDays: 3,
      items: [
        {
          subscriptionId: 's',
          collectionId: 'personal',
          name: '@everyone **bold** `code`',
          iconRef: 'example.com',
          expectedDate: '2026-10-07',
          amountCents: 100,
        },
      ],
      collectionNames,
    });
    const message = buildDiscordMessage(content);

    expect(message.allowed_mentions).toEqual({ parse: [] });
    expect(message.embeds[0].fields[0].value).toContain(escapeDiscordText('@everyone **bold** `code`'));
    expect(escapeDiscordText('**bold**')).toBe('\\*\\*bold\\*\\*');
  });

  it('stays within Discord’s limits for a long list while keeping full totals', () => {
    const items = Array.from({ length: 300 }, (_, index) => ({
      subscriptionId: `sub-${index}`,
      collectionId: `collection-${index % 40}`,
      name: `Subscription with a fairly long descriptive name ${index}`,
      iconRef: 'example.com',
      expectedDate: '2026-10-07',
      amountCents: 1000,
    }));
    const names = new Map(items.map((item) => [item.collectionId, `Collection ${item.collectionId}`]));
    const content = buildReminderContent({ meta: meta('2026-10-04'), leadDays: 3, items, collectionNames: names });
    const [embed] = buildDiscordMessage(content).embeds;
    const length =
      embed.title.length +
      embed.description.length +
      (embed.footer?.text.length ?? 0) +
      embed.fields.reduce((total, field) => total + field.name.length + field.value.length, 0);

    expect(length).toBeLessThanOrEqual(DISCORD_LIMITS.embedTotal);
    expect(embed.fields.length).toBeLessThanOrEqual(DISCORD_LIMITS.fieldsPerEmbed);
    expect(embed.fields.every((field) => field.value.length <= DISCORD_LIMITS.fieldValue)).toBe(true);
    expect(embed.description).toContain('300 expected charges · $3,000.00');
  });

  it('labels each new-month item as recorded or projected, with its category', () => {
    const content = buildSampleOverview({ eventId: 'evt', test: false, timeZone: TIME_ZONE, month: '2026-10' });
    const values = buildDiscordMessage(content)
      .embeds[2].fields.map((field) => field.value)
      .join('\n');

    expect(values).toContain('_Recorded · Streaming_');
    expect(values).toContain('_Projected · Music_');
  });
});

describe('content', () => {
  it('groups by collection name, then sorts items by date and name', () => {
    const content = buildReminderContent({
      meta: meta('2026-10-04'),
      leadDays: 3,
      items: [
        {
          subscriptionId: 'b',
          collectionId: 'work',
          name: 'B',
          iconRef: '',
          expectedDate: '2026-10-07',
          amountCents: 200,
        },
        {
          subscriptionId: 'a',
          collectionId: 'personal',
          name: 'Z',
          iconRef: '',
          expectedDate: '2026-10-06',
          amountCents: 100,
        },
        {
          subscriptionId: 'c',
          collectionId: 'personal',
          name: 'A',
          iconRef: '',
          expectedDate: '2026-10-06',
          amountCents: 300,
        },
      ],
      collectionNames,
    });

    expect(content.collections.map((group) => [group.collectionName, group.itemCount, group.subtotalCents])).toEqual([
      ['Personal', 2, 400],
      ['Work', 1, 200],
    ]);
    expect(content.collections[0].items.map((item) => item.name)).toEqual(['A', 'Z']);
    expect(content).toMatchObject({ itemCount: 3, totalCents: 600 });
  });

  it('treats an overview as empty only when both months are', () => {
    const empty = buildSampleOverview({
      eventId: 'e',
      test: false,
      timeZone: TIME_ZONE,
      month: '2026-10',
      previousCount: 0,
      newMonthCount: 0,
    });
    const oneSection = buildSampleOverview({
      eventId: 'e',
      test: false,
      timeZone: TIME_ZONE,
      month: '2026-10',
      previousCount: 0,
      newMonthCount: 1,
    });

    expect(isContentEmpty(empty)).toBe(true);
    expect(isContentEmpty(oneSection)).toBe(false);
  });
});
