import type {
  CollectionGroup,
  NotificationContent,
  OverviewContent,
  ReminderContent,
} from '@/features/notifications/content';
import { getOverviewItemDetail } from '@/features/notifications/email/copy';
import {
  BRAND_COLOR,
  formatMonth,
  formatMonthName,
  formatShortDate,
  formatUsd,
  formatWeekdayDate,
  pluralize,
} from '@/features/notifications/format';

// Discord's documented embed limits.
export const DISCORD_LIMITS = {
  embedTotal: 6000,
  description: 4096,
  fieldsPerEmbed: 25,
  fieldName: 256,
  fieldValue: 1024,
} as const;

const EMBED_COLOR = Number.parseInt(BRAND_COLOR.slice(1), 16);

export type DiscordField = { name: string; value: string; inline?: boolean };

export type DiscordEmbed = {
  title: string;
  description: string;
  color: number;
  fields: DiscordField[];
  footer?: { text: string };
};

export type DiscordMessage = {
  username: string;
  // Names are user-provided, so they must never ping anyone.
  allowed_mentions: { parse: never[] };
  embeds: DiscordEmbed[];
};

/** Escapes Discord markdown in user-provided text and keeps it on one line. */
export function escapeDiscordText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/([\\*_~`|>#[\]()-])/g, '\\$1');
}

function truncate(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}

type FieldSource = { name: string; lines: string[] };

/** Builds a field showing as many lines as fit, then a count of the rest. */
function buildField(source: FieldSource, maxLines: number): DiscordField {
  const name = truncate(source.name, DISCORD_LIMITS.fieldName);
  const shown: string[] = [];

  for (const line of source.lines) {
    const remaining = source.lines.length - shown.length - 1;
    const overflow = remaining > 0 ? `\n…and ${remaining} more` : '';
    const candidate = [...shown, line].join('\n');

    if (shown.length >= maxLines || candidate.length + overflow.length > DISCORD_LIMITS.fieldValue) {
      break;
    }

    shown.push(line);
  }

  const hidden = source.lines.length - shown.length;
  const value = hidden > 0 ? `${shown.join('\n')}${shown.length > 0 ? '\n' : ''}…and ${hidden} more` : shown.join('\n');

  return { name, value: value || '—' };
}

function embedLength(embed: DiscordEmbed): number {
  return (
    embed.title.length +
    embed.description.length +
    (embed.footer?.text.length ?? 0) +
    embed.fields.reduce((total, field) => total + field.name.length + field.value.length, 0)
  );
}

type EmbedSource = Omit<DiscordEmbed, 'fields' | 'color'> & { fields: FieldSource[] };

function buildEmbeds(sources: EmbedSource[], maxLines: number, maxFields: number): DiscordEmbed[] {
  return sources.map((source) => {
    const visible = source.fields.slice(0, maxFields);
    const hiddenFields = source.fields.length - visible.length;
    const fields = visible.map((field) => buildField(field, maxLines));

    if (hiddenFields > 0) {
      fields.push({ name: `…and ${pluralize(hiddenFields, 'more collection')}`, value: 'Totals above include them.' });
    }

    return {
      title: truncate(source.title, 256),
      description: truncate(source.description, DISCORD_LIMITS.description),
      color: EMBED_COLOR,
      fields,
      ...(source.footer ? { footer: source.footer } : {}),
    };
  });
}

/**
 * Lays out embeds within Discord's limits. Long lists show fewer lines per
 * collection, then fewer collections, rather than splitting the notification
 * across several messages. Counts and totals always cover every item.
 */
function fitEmbeds(sources: EmbedSource[]): DiscordEmbed[] {
  const lineCaps = [Infinity, 20, 12, 8, 5, 3, 1];
  const fieldCaps = [DISCORD_LIMITS.fieldsPerEmbed - 1, 12, 6, 3, 1];
  let embeds: DiscordEmbed[] = [];

  for (const maxFields of fieldCaps) {
    for (const maxLines of lineCaps) {
      embeds = buildEmbeds(sources, maxLines, maxFields);

      if (embeds.reduce((total, embed) => total + embedLength(embed), 0) <= DISCORD_LIMITS.embedTotal) {
        return embeds;
      }
    }
  }

  return embeds;
}

function groupField<TItem>(
  group: CollectionGroup<TItem>,
  formatLine: (item: TItem) => string,
  noun: string,
): FieldSource {
  return {
    name: `${group.collectionName} · ${pluralize(group.itemCount, noun)} · ${formatUsd(group.subtotalCents)}`,
    lines: group.items.map(formatLine),
  };
}

const TEST_PREFIX = 'Test · ';

function buildReminderMessage(content: ReminderContent): DiscordEmbed[] {
  const latestDate = content.collections
    .flatMap((group) => group.items.map((item) => item.expectedDate))
    .reduce((latest, date) => (date > latest ? date : latest), content.localDate);

  return fitEmbeds([
    {
      title: `${content.test ? TEST_PREFIX : ''}Upcoming renewals`,
      description: [
        `**${pluralize(content.itemCount, 'expected charge')} · ${formatUsd(content.totalCents)}** through ${formatWeekdayDate(latestDate)}`,
        content.test
          ? 'This is a test with sample data. No real subscriptions are included.'
          : 'Dates and amounts are expected from your EverySub schedule. They aren’t confirmed charges.',
      ].join('\n'),
      fields: content.collections.map((group) =>
        groupField(
          group,
          (item) =>
            `\`${formatShortDate(item.expectedDate)}\` ${escapeDiscordText(item.name)} · **${formatUsd(item.amountCents)}**`,
          'charge',
        ),
      ),
      footer: { text: `Reminder for ${formatWeekdayDate(content.localDate)} · ${content.timeZone}` },
    },
  ]);
}

function buildOverviewMessage(content: OverviewContent): DiscordEmbed[] {
  const { previousMonth, newMonth } = content;
  const previousName = formatMonthName(previousMonth.month);
  const newName = formatMonthName(newMonth.month);

  const previousFields = previousMonth.collections.map((group) =>
    groupField(
      group,
      (item) =>
        `\`${formatShortDate(item.date)}\` ${escapeDiscordText(item.name)} · ${formatUsd(item.amountCents)} · _${escapeDiscordText(item.category)}_`,
      'invoice',
    ),
  );
  const newFields = newMonth.collections.map((group) =>
    groupField(
      group,
      (item) =>
        `\`${formatShortDate(item.date)}\` ${escapeDiscordText(item.name)} · ${formatUsd(item.amountCents)} · _${escapeDiscordText(getOverviewItemDetail(item, true))}_`,
      'invoice',
    ),
  );

  return fitEmbeds([
    {
      title: `${content.test ? TEST_PREFIX : ''}${formatMonth(newMonth.month)} subscription overview`,
      description: [
        `Recorded ${previousName} charges and ${newName}’s expected schedule.`,
        content.test
          ? 'This is a test with sample data. No real subscriptions are included.'
          : 'Recorded invoices are schedule snapshots and projections are estimates. Neither is a confirmed payment.',
      ].join('\n'),
      fields: [],
    },
    {
      title: `${formatMonth(previousMonth.month)} · Recorded scheduled charges`,
      description:
        previousMonth.itemCount === 0
          ? `No recorded charges in ${previousName}.`
          : `**${pluralize(previousMonth.itemCount, 'invoice')} · ${formatUsd(previousMonth.subtotalCents)}**`,
      fields: previousFields,
    },
    {
      title: `${formatMonth(newMonth.month)} · Expected schedule`,
      description:
        newMonth.itemCount === 0
          ? `Nothing expected in ${newName}.`
          : `**${pluralize(newMonth.itemCount, 'invoice')} · ${formatUsd(newMonth.subtotalCents)}** · ${newMonth.recordedCount} recorded, ${newMonth.projectedCount} projected`,
      fields: newFields,
      footer: { text: `Overview for ${formatMonth(newMonth.month)} · ${content.timeZone}` },
    },
  ]);
}

export function buildDiscordMessage(content: NotificationContent): DiscordMessage {
  return {
    username: 'EverySub',
    allowed_mentions: { parse: [] },
    embeds: content.kind === 'renewal_reminder' ? buildReminderMessage(content) : buildOverviewMessage(content),
  };
}
