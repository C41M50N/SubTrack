import { buildSampleOverview, buildSampleReminder } from '@/features/notifications/samples';

// Representative content for email previews and render tests. All sample data
// is fictional.

const TIME_ZONE = 'America/New_York';

export const PREVIEW_MANAGE_URL = 'https://everysub.example/settings/notifications';

export const singleReminderFixture = buildSampleReminder({
  eventId: 'evt_preview_single',
  test: false,
  timeZone: TIME_ZONE,
  localDate: '2026-10-04',
  itemCount: 1,
});

export const severalCollectionsReminderFixture = buildSampleReminder({
  eventId: 'evt_preview_several',
  test: false,
  timeZone: TIME_ZONE,
  localDate: '2026-10-04',
  itemCount: 7,
});

export const overviewWithEmptySectionFixture = buildSampleOverview({
  eventId: 'evt_preview_empty_section',
  test: false,
  timeZone: TIME_ZONE,
  month: '2026-10',
  previousCount: 0,
  newMonthCount: 4,
});

export const longOverviewFixture = buildSampleOverview({
  eventId: 'evt_preview_long',
  test: false,
  timeZone: TIME_ZONE,
  month: '2026-10',
  previousCount: 12,
  newMonthCount: 12,
});
