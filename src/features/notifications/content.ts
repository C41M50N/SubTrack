// The eligible data for one notification. Email, Discord, and generic webhook
// formats all render from this, so a subscription excluded here can't leak
// into any of them. Amounts are USD cents.

export type NotificationMeta = {
  /** Stable across retries. Test sends get a one-off ID. */
  eventId: string;
  test: boolean;
  timeZone: string;
  /** 9 a.m. local on `localDate`. */
  scheduledFor: Date;
  /** The reminder date, or the first day of the overview's new month. */
  localDate: string;
};

export type CollectionGroup<TItem> = {
  collectionId: string;
  collectionName: string;
  itemCount: number;
  subtotalCents: number;
  items: TItem[];
};

export type ReminderItem = {
  subscriptionId: string;
  collectionId: string;
  name: string;
  iconRef: string;
  expectedDate: string;
  amountCents: number;
};

export type ReminderContent = NotificationMeta & {
  kind: 'renewal_reminder';
  leadDays: number;
  itemCount: number;
  totalCents: number;
  collections: CollectionGroup<ReminderItem>[];
};

export type RecordedInvoiceItem = {
  source: 'recorded';
  invoiceId: string;
  /** Null once the subscription has been deleted. */
  subscriptionId: string | null;
  /** The collection recorded on the invoice, which a later move doesn't change. */
  collectionId: string;
  name: string;
  iconRef: string;
  category: string;
  date: string;
  amountCents: number;
};

export type ProjectedInvoiceItem = {
  source: 'projected';
  subscriptionId: string;
  collectionId: string;
  name: string;
  iconRef: string;
  category: string;
  date: string;
  amountCents: number;
};

export type NewMonthItem = RecordedInvoiceItem | ProjectedInvoiceItem;

export type OverviewSection<TItem> = {
  /** yyyy-MM */
  month: string;
  itemCount: number;
  subtotalCents: number;
  collections: CollectionGroup<TItem>[];
};

export type OverviewContent = NotificationMeta & {
  kind: 'monthly_overview';
  /** Recorded scheduled invoices from the complete previous month. */
  previousMonth: OverviewSection<RecordedInvoiceItem>;
  /** Recorded invoices already due this month, then projected occurrences. */
  newMonth: OverviewSection<NewMonthItem> & { recordedCount: number; projectedCount: number };
};

export type NotificationContent = ReminderContent | OverviewContent;

type GroupableItem = { collectionId: string; date?: string; expectedDate?: string; name: string; amountCents: number };

function itemDate(item: GroupableItem): string {
  return item.date ?? item.expectedDate ?? '';
}

function compareItems(a: GroupableItem, b: GroupableItem): number {
  return itemDate(a).localeCompare(itemDate(b)) || a.name.localeCompare(b.name) || b.amountCents - a.amountCents;
}

/** Groups items under their collections, sorted by collection name, then date and name. */
export function groupByCollection<TItem extends GroupableItem>(
  items: TItem[],
  collectionNames: ReadonlyMap<string, string>,
): CollectionGroup<TItem>[] {
  const groups = new Map<string, CollectionGroup<TItem>>();

  for (const item of items) {
    let group = groups.get(item.collectionId);

    if (!group) {
      group = {
        collectionId: item.collectionId,
        collectionName: collectionNames.get(item.collectionId) ?? 'Collection',
        itemCount: 0,
        subtotalCents: 0,
        items: [],
      };
      groups.set(item.collectionId, group);
    }

    group.items.push(item);
    group.itemCount += 1;
    group.subtotalCents += item.amountCents;
  }

  return [...groups.values()]
    .map((group) => ({ ...group, items: group.items.sort(compareItems) }))
    .sort((a, b) => a.collectionName.localeCompare(b.collectionName) || a.collectionId.localeCompare(b.collectionId));
}

export function buildReminderContent(input: {
  meta: NotificationMeta;
  leadDays: number;
  items: ReminderItem[];
  collectionNames: ReadonlyMap<string, string>;
}): ReminderContent {
  const collections = groupByCollection(input.items, input.collectionNames);

  return {
    ...input.meta,
    kind: 'renewal_reminder',
    leadDays: input.leadDays,
    itemCount: input.items.length,
    totalCents: input.items.reduce((total, item) => total + item.amountCents, 0),
    collections,
  };
}

function buildSection<TItem extends GroupableItem>(
  month: string,
  items: TItem[],
  collectionNames: ReadonlyMap<string, string>,
): OverviewSection<TItem> {
  return {
    month,
    itemCount: items.length,
    subtotalCents: items.reduce((total, item) => total + item.amountCents, 0),
    collections: groupByCollection(items, collectionNames),
  };
}

export function buildOverviewContent(input: {
  meta: NotificationMeta;
  month: string;
  previousMonth: string;
  previousItems: RecordedInvoiceItem[];
  newMonthItems: NewMonthItem[];
  collectionNames: ReadonlyMap<string, string>;
}): OverviewContent {
  const newMonth = buildSection(input.month, input.newMonthItems, input.collectionNames);

  return {
    ...input.meta,
    kind: 'monthly_overview',
    previousMonth: buildSection(input.previousMonth, input.previousItems, input.collectionNames),
    newMonth: {
      ...newMonth,
      recordedCount: input.newMonthItems.filter((item) => item.source === 'recorded').length,
      projectedCount: input.newMonthItems.filter((item) => item.source === 'projected').length,
    },
  };
}

export function isContentEmpty(content: NotificationContent): boolean {
  return content.kind === 'renewal_reminder'
    ? content.itemCount === 0
    : content.previousMonth.itemCount === 0 && content.newMonth.itemCount === 0;
}
