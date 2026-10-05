import {
  buildOverviewContent,
  buildReminderContent,
  type NewMonthItem,
  type NotificationMeta,
  type OverviewContent,
  type RecordedInvoiceItem,
  type ReminderContent,
  type ReminderItem,
} from '@/features/notifications/content';
import { addDaysToDateKey, addMonthsToMonthKey, getSendTime, toMonthKey } from '@/features/notifications/time';

// Fictional subscriptions for destination tests and email previews. None of
// this comes from a user's data.

const SAMPLE_COLLECTIONS = new Map([
  ['sample-household', 'Household'],
  ['sample-work', 'Work'],
  ['sample-side-project', 'Side project'],
]);

type SampleService = { name: string; iconRef: string; category: string; amountCents: number; collectionId: string };

const SAMPLE_SERVICES: SampleService[] = [
  {
    name: 'Streamline Video',
    iconRef: 'example.com',
    category: 'Streaming',
    amountCents: 1599,
    collectionId: 'sample-household',
  },
  {
    name: 'Tunebox Family',
    iconRef: 'example.com',
    category: 'Music',
    amountCents: 1699,
    collectionId: 'sample-household',
  },
  {
    name: 'CloudVault 2 TB',
    iconRef: 'example.com',
    category: 'Storage',
    amountCents: 999,
    collectionId: 'sample-household',
  },
  {
    name: 'Pagewise Docs',
    iconRef: 'example.com',
    category: 'Productivity',
    amountCents: 1200,
    collectionId: 'sample-work',
  },
  {
    name: 'Shipyard CI',
    iconRef: 'example.com',
    category: 'Developer tools',
    amountCents: 2900,
    collectionId: 'sample-work',
  },
  {
    name: 'Northwind Hosting',
    iconRef: 'example.com',
    category: 'Hosting',
    amountCents: 2000,
    collectionId: 'sample-side-project',
  },
  {
    name: 'Inkwell Fonts',
    iconRef: 'example.com',
    category: 'Design',
    amountCents: 799,
    collectionId: 'sample-side-project',
  },
  {
    name: 'Daily Grind News',
    iconRef: 'example.com',
    category: 'News',
    amountCents: 499,
    collectionId: 'sample-household',
  },
  {
    name: 'FitTrack Pro',
    iconRef: 'example.com',
    category: 'Health',
    amountCents: 1299,
    collectionId: 'sample-household',
  },
  {
    name: 'Lexicon Language',
    iconRef: 'example.com',
    category: 'Education',
    amountCents: 1399,
    collectionId: 'sample-household',
  },
  { name: 'Ledgerly', iconRef: 'example.com', category: 'Finance', amountCents: 1500, collectionId: 'sample-work' },
  {
    name: 'Meetly Video Calls',
    iconRef: 'example.com',
    category: 'Productivity',
    amountCents: 1499,
    collectionId: 'sample-work',
  },
];

function sampleMeta(input: { eventId: string; test: boolean; timeZone: string; localDate: string }): NotificationMeta {
  return {
    eventId: input.eventId,
    test: input.test,
    timeZone: input.timeZone,
    localDate: input.localDate,
    scheduledFor: getSendTime(input.localDate, input.timeZone),
  };
}

function sampleId(service: SampleService): string {
  return `sample-${service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export function buildSampleReminder(input: {
  eventId: string;
  test: boolean;
  timeZone: string;
  localDate: string;
  leadDays?: number;
  itemCount?: number;
}): ReminderContent {
  const leadDays = input.leadDays ?? 3;
  const items: ReminderItem[] = SAMPLE_SERVICES.slice(0, input.itemCount ?? 3).map((service, index) => ({
    subscriptionId: sampleId(service),
    collectionId: service.collectionId,
    name: service.name,
    iconRef: service.iconRef,
    expectedDate: addDaysToDateKey(input.localDate, leadDays - (index % 2)),
    amountCents: service.amountCents,
  }));

  return buildReminderContent({
    meta: sampleMeta(input),
    leadDays,
    items,
    collectionNames: SAMPLE_COLLECTIONS,
  });
}

export function buildSampleOverview(input: {
  eventId: string;
  test: boolean;
  timeZone: string;
  /** The overview's new month, yyyy-MM. */
  month: string;
  previousCount?: number;
  newMonthCount?: number;
}): OverviewContent {
  const previousMonth = addMonthsToMonthKey(input.month, -1);
  const previousItems: RecordedInvoiceItem[] = SAMPLE_SERVICES.slice(0, input.previousCount ?? 5).map(
    (service, index) => ({
      source: 'recorded',
      invoiceId: `sample-invoice-${previousMonth}-${index}`,
      subscriptionId: sampleId(service),
      collectionId: service.collectionId,
      name: service.name,
      iconRef: service.iconRef,
      category: service.category,
      date: `${previousMonth}-${String(((index * 5) % 27) + 1).padStart(2, '0')}`,
      amountCents: service.amountCents,
    }),
  );
  const newMonthItems: NewMonthItem[] = SAMPLE_SERVICES.slice(0, input.newMonthCount ?? 6).map((service, index) => {
    const date = `${input.month}-${String(((index * 4) % 27) + 1).padStart(2, '0')}`;

    return index === 0
      ? {
          source: 'recorded',
          invoiceId: `sample-invoice-${input.month}-${index}`,
          subscriptionId: sampleId(service),
          collectionId: service.collectionId,
          name: service.name,
          iconRef: service.iconRef,
          category: service.category,
          date,
          amountCents: service.amountCents,
        }
      : {
          source: 'projected',
          subscriptionId: sampleId(service),
          collectionId: service.collectionId,
          name: service.name,
          iconRef: service.iconRef,
          category: service.category,
          date,
          amountCents: service.amountCents,
        };
  });

  return buildOverviewContent({
    meta: sampleMeta({ ...input, localDate: `${input.month}-01` }),
    month: input.month,
    previousMonth,
    previousItems,
    newMonthItems,
    collectionNames: SAMPLE_COLLECTIONS,
  });
}

/** A labeled test reminder dated from the user's current local date. */
export function buildTestReminder(input: { eventId: string; timeZone: string; localDate: string; leadDays: number }) {
  return buildSampleReminder({ ...input, test: true, itemCount: 3 });
}

/** A labeled test overview for the month containing `localDate`. */
export function buildTestOverview(input: { eventId: string; timeZone: string; localDate: string }) {
  return buildSampleOverview({ ...input, test: true, month: toMonthKey(input.localDate) });
}
