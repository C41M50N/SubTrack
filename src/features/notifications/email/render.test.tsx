import { describe, expect, it } from 'vitest';

import {
  longOverviewFixture,
  overviewWithEmptySectionFixture,
  PREVIEW_MANAGE_URL,
  severalCollectionsReminderFixture,
  singleReminderFixture,
} from '@/features/notifications/email/fixtures';
import { renderNotificationEmail } from '@/features/notifications/email/render';
import { formatUsd } from '@/features/notifications/format';
import { buildTestReminder } from '@/features/notifications/samples';

const render = (content: Parameters<typeof renderNotificationEmail>[0]) =>
  renderNotificationEmail(content, { manageUrl: PREVIEW_MANAGE_URL });

// Wording that would imply EverySub confirmed a payment.
const CONFIRMATION_WORDING =
  /\b(paid|payment (?:was )?(?:confirmed|received|successful)|you were charged|receipt)\b/i;

describe('renewal reminder email', () => {
  it('names a single renewal in the subject without implying payment', async () => {
    const email = await render(singleReminderFixture);
    const [item] = singleReminderFixture.collections[0].items;

    expect(email.subject).toBe(
      `${item.name} is expected to renew on Wed, Oct 7`,
    );
    expect(email.previewText).toContain('hasn’t confirmed');
    expect(email.html).toContain(email.previewText);

    for (const body of [email.subject, email.html, email.text]) {
      expect(body).not.toMatch(CONFIRMATION_WORDING);
    }
  });

  it('lists every collection and subscription in HTML and text', async () => {
    const email = await render(severalCollectionsReminderFixture);

    for (const group of severalCollectionsReminderFixture.collections) {
      for (const body of [email.html, email.text]) {
        expect(body).toContain(group.collectionName);
        expect(body).toContain(formatUsd(group.subtotalCents));

        for (const item of group.items) {
          expect(body).toContain(item.name);
        }
      }
    }

    expect(email.subject).toBe(
      '7 subscriptions expected to renew by Wed, Oct 7',
    );
  });

  it('contains no subscription links or cancellation actions', async () => {
    const email = await render(severalCollectionsReminderFixture);
    const links = [...email.html.matchAll(/href="([^"]+)"/g)].map(
      (match) => match[1],
    );

    // The only link manages notification settings.
    expect(links).toEqual([PREVIEW_MANAGE_URL]);
    expect(email.text.match(/https?:\/\/\S+/g)).toEqual([PREVIEW_MANAGE_URL]);
  });

  it('labels test emails in the subject and body', async () => {
    const email = await render(
      buildTestReminder({
        eventId: 'test_1',
        timeZone: 'America/New_York',
        localDate: '2026-10-04',
        leadDays: 3,
      }),
    );

    expect(email.subject).toMatch(/^\[Test\] /);
    expect(email.html).toContain('This is a test with sample data');
    expect(email.text).toContain('TEST: This is a test with sample data');
  });
});

describe('monthly overview email', () => {
  it('shows an empty state for one empty section', async () => {
    const email = await render(overviewWithEmptySectionFixture);

    expect(email.subject).toBe('Your October 2026 subscription schedule');
    expect(email.previewText).toBe(
      'September’s recorded charges and October’s expected schedule.',
    );

    for (const body of [email.html, email.text]) {
      expect(body).toContain(
        'No scheduled charges were recorded in September.',
      );
      expect(body).toMatch(/Recorded scheduled charges/i);
      expect(body).toMatch(/Expected schedule/i);
    }
  });

  it('renders a long itemized list with recorded and projected labels', async () => {
    const email = await render(longOverviewFixture);
    const itemCount =
      longOverviewFixture.previousMonth.itemCount +
      longOverviewFixture.newMonth.itemCount;

    expect(
      email.text.split('\n').filter((line) => line.startsWith('  - ')),
    ).toHaveLength(itemCount);
    expect(email.text).toContain('(Recorded · Streaming)');
    expect(email.text).toContain('(Projected · Music)');
    expect(email.html).toContain('Projected · Music');
    // Previous-month rows show the category recorded on the invoice.
    expect(email.text).toMatch(/Streamline Video, \$15\.99 \(Streaming\)/);

    for (const body of [email.subject, email.html, email.text]) {
      expect(body).not.toMatch(CONFIRMATION_WORDING);
      // Month-to-month totals are never compared.
      expect(body).not.toMatch(
        /increase|decrease|more than last month|less than last month/i,
      );
    }
  });

  it('keeps the layout fluid for narrow screens', async () => {
    const email = await render(longOverviewFixture);

    expect(email.html).toMatch(/max-width:600px/);
    expect(email.html).toMatch(/width:100%/);
    expect(email.html).toContain('name="viewport"');
  });
});
