import type {
  NewMonthItem,
  NotificationContent,
  OverviewContent,
  RecordedInvoiceItem,
  ReminderContent,
} from '@/features/notifications/content';

// The generic webhook contract. Bump the version for any breaking change.
// docs/notifications/webhooks.md documents the payload for receivers.
export const WEBHOOK_SCHEMA_VERSION = 1;

const CURRENCY = 'USD';

export type WebhookDestinationRef = { id: string; name: string };

function buildEnvelope(content: NotificationContent, destination: WebhookDestinationRef) {
  return {
    schemaVersion: WEBHOOK_SCHEMA_VERSION,
    id: content.eventId,
    type: content.kind,
    test: content.test,
    destination: { id: destination.id, name: destination.name },
    schedule: {
      localDate: content.localDate,
      timeZone: content.timeZone,
      scheduledFor: content.scheduledFor.toISOString(),
    },
  };
}

function buildReminderData(content: ReminderContent) {
  return {
    leadDays: content.leadDays,
    currency: CURRENCY,
    itemCount: content.itemCount,
    totalExpectedAmountCents: content.totalCents,
    collections: content.collections.map((group) => ({
      id: group.collectionId,
      name: group.collectionName,
      itemCount: group.itemCount,
      subtotalExpectedAmountCents: group.subtotalCents,
      items: group.items.map((item) => ({
        subscriptionId: item.subscriptionId,
        collectionId: item.collectionId,
        name: item.name,
        expectedInvoiceDate: item.expectedDate,
        expectedAmountCents: item.amountCents,
        currency: CURRENCY,
      })),
    })),
  };
}

function toRecordedItem(item: RecordedInvoiceItem) {
  return {
    invoiceId: item.invoiceId,
    subscriptionId: item.subscriptionId,
    collectionId: item.collectionId,
    name: item.name,
    iconRef: item.iconRef,
    category: item.category,
    invoiceDate: item.date,
    amountCents: item.amountCents,
    currency: CURRENCY,
  };
}

function toNewMonthItem(item: NewMonthItem) {
  const shared = {
    collectionId: item.collectionId,
    name: item.name,
    iconRef: item.iconRef,
    category: item.category,
    date: item.date,
    expectedAmountCents: item.amountCents,
    currency: CURRENCY,
  };

  return item.source === 'recorded'
    ? {
        id: item.invoiceId,
        source: item.source,
        invoiceId: item.invoiceId,
        subscriptionId: item.subscriptionId,
        ...shared,
      }
    : {
        id: `${item.subscriptionId}:${item.date}`,
        source: item.source,
        subscriptionId: item.subscriptionId,
        ...shared,
      };
}

function buildOverviewData(content: OverviewContent) {
  return {
    currency: CURRENCY,
    previousMonth: {
      month: content.previousMonth.month,
      // Snapshots of what was scheduled, not confirmed payments.
      basis: 'recorded_scheduled_invoices',
      itemCount: content.previousMonth.itemCount,
      subtotalAmountCents: content.previousMonth.subtotalCents,
      collections: content.previousMonth.collections.map((group) => ({
        id: group.collectionId,
        name: group.collectionName,
        itemCount: group.itemCount,
        subtotalAmountCents: group.subtotalCents,
        items: group.items.map(toRecordedItem),
      })),
    },
    newMonth: {
      month: content.newMonth.month,
      basis: 'expected_schedule',
      itemCount: content.newMonth.itemCount,
      recordedCount: content.newMonth.recordedCount,
      projectedCount: content.newMonth.projectedCount,
      subtotalExpectedAmountCents: content.newMonth.subtotalCents,
      collections: content.newMonth.collections.map((group) => ({
        id: group.collectionId,
        name: group.collectionName,
        itemCount: group.itemCount,
        subtotalExpectedAmountCents: group.subtotalCents,
        items: group.items.map(toNewMonthItem),
      })),
    },
  };
}

export function buildWebhookPayload(content: NotificationContent, destination: WebhookDestinationRef) {
  return {
    ...buildEnvelope(content, destination),
    data: content.kind === 'renewal_reminder' ? buildReminderData(content) : buildOverviewData(content),
  };
}

export type WebhookPayload = ReturnType<typeof buildWebhookPayload>;
