import { sql } from 'drizzle-orm';
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { generateId } from '@/lib/data-utils';
import { user } from '@/lib/db/auth-schema';
import { collectionTable } from '@/lib/db/collection-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';

export const MIN_REMINDER_LEAD_DAYS = 1;
export const MAX_REMINDER_LEAD_DAYS = 6;
export const DEFAULT_REMINDER_LEAD_DAYS = 3;

export const notificationDestinationTypeEnum = pgEnum('notification_destination_type', ['email', 'webhook', 'discord']);

export const notificationKindEnum = pgEnum('notification_kind', ['renewal_reminder', 'monthly_overview']);

// Why a destination stopped receiving notifications. `user` is a manual pause;
// the rest are set by delivery and need the user's attention.
export const notificationPauseReasonEnum = pgEnum('notification_pause_reason', [
  'user',
  'rejected',
  'failing',
  'recipient_rejected',
]);

export const notificationEventStatusEnum = pgEnum('notification_event_status', [
  'pending',
  'sending',
  'retrying',
  'succeeded',
  'failed',
  'cancelled',
  'skipped',
]);

// What Resend has reported about an accepted email. `accepted` means Resend
// took the request; only `delivered` means the recipient's server accepted it.
export const emailDeliveryStatusEnum = pgEnum('email_delivery_status', [
  'accepted',
  'delayed',
  'delivered',
  'bounced',
  'complained',
  'suppressed',
  'failed',
]);

export const notificationAttemptOutcomeEnum = pgEnum('notification_attempt_outcome', [
  'succeeded',
  'temporary_failure',
  'permanent_failure',
  'cancelled',
]);

export type NotificationDestinationType = (typeof notificationDestinationTypeEnum.enumValues)[number];
export type NotificationKind = (typeof notificationKindEnum.enumValues)[number];
export type NotificationPauseReason = (typeof notificationPauseReasonEnum.enumValues)[number];
export type NotificationEventStatus = (typeof notificationEventStatusEnum.enumValues)[number];
export type EmailDeliveryStatus = (typeof emailDeliveryStatusEnum.enumValues)[number];
export type NotificationAttemptOutcome = (typeof notificationAttemptOutcomeEnum.enumValues)[number];

/** A rotated-out signing secret that keeps signing requests until it expires. */
export type RetiredSigningSecret = { secret: string; expiresAt: string };

// One row per user once they choose a time zone. Users without a row receive
// no scheduled notifications.
export const notificationSettingsTable = pgTable(
  'notification_settings',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    timeZone: text('time_zone').notNull(),
    reminderLeadDays: integer('reminder_lead_days').notNull().default(DEFAULT_REMINDER_LEAD_DAYS),
    // Reminder times before this instant are never caught up, so changing the
    // time zone or lead time can't trigger an immediate send.
    timingChangedAt: timestamp('timing_changed_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check(
      'notification_settings_reminder_lead_days_range',
      sql`${table.reminderLeadDays} between ${sql.raw(String(MIN_REMINDER_LEAD_DAYS))} and ${sql.raw(String(MAX_REMINDER_LEAD_DAYS))}`,
    ),
  ],
);

export const notificationDestinationTable = pgTable(
  'notification_destinations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: notificationDestinationTypeEnum('type').notNull(),
    name: text('name').notNull(),
    // Secret: never returned to the browser or written to logs. Email
    // destinations have no URL; they always use the account's verified email.
    webhookUrl: text('webhook_url'),
    // Generic webhooks only. Rotated-out secrets keep signing requests until
    // they expire, so rotating, even twice in a row, never breaks a receiver
    // that hasn't switched yet.
    signingSecret: text('signing_secret'),
    retiredSigningSecrets: jsonb('retired_signing_secrets').$type<RetiredSigningSecret[]>().notNull().default([]),
    pausedAt: timestamp('paused_at', { withTimezone: true }),
    pauseReason: notificationPauseReasonEnum('pause_reason'),
    // A user-facing explanation for a delivery-initiated pause. Never contains
    // the URL, secrets, or subscription details.
    pauseMessage: text('pause_message'),
    // Consecutive events that exhausted their retries. Three pause the
    // destination; any success resets the count.
    consecutiveFailedEvents: integer('consecutive_failed_events').notNull().default(0),
    lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
    lastFailureAt: timestamp('last_failure_at', { withTimezone: true }),
    lastFailureMessage: text('last_failure_message'),
    lastTestAt: timestamp('last_test_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // All destinations for this user
    index('notification_destinations_user_id_idx').on(table.userId),

    // Let routes and events prove a referenced destination belongs to this user.
    unique('notification_destinations_user_id_id_unique').on(table.userId, table.id),

    // Email always means the account's own address, so one email destination is enough.
    uniqueIndex('notification_destinations_one_email_per_user')
      .on(table.userId)
      .where(sql`${table.type} = 'email'`),

    check(
      'notification_destinations_webhook_url_required',
      sql`(${table.type} = 'email') = (${table.webhookUrl} is null)`,
    ),
    check(
      'notification_destinations_signing_secret_required',
      sql`(${table.type} = 'webhook') = (${table.signingSecret} is not null)`,
    ),
    check(
      'notification_destinations_pause_reason_required',
      sql`(${table.pausedAt} is null) = (${table.pauseReason} is null)`,
    ),
  ],
);

// A collection's explicit choice to send one notification kind to one
// destination. Removing a route deletes the row; re-adding creates a new one,
// so createdAt is always when the current route was turned on.
export const notificationRouteTable = pgTable(
  'notification_routes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    collectionId: text('collection_id').notNull(),
    destinationId: text('destination_id').notNull(),
    kind: notificationKindEnum('kind').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('notification_routes_collection_destination_kind_unique').on(
      table.collectionId,
      table.destinationId,
      table.kind,
    ),

    // All routes that deliver to this destination
    index('notification_routes_destination_id_idx').on(table.destinationId),

    // All routes for this user
    index('notification_routes_user_id_idx').on(table.userId),

    foreignKey({
      name: 'notification_routes_user_collection_fk',
      columns: [table.userId, table.collectionId],
      foreignColumns: [collectionTable.userId, collectionTable.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'notification_routes_user_destination_fk',
      columns: [table.userId, table.destinationId],
      foreignColumns: [notificationDestinationTable.userId, notificationDestinationTable.id],
    }).onDelete('cascade'),
  ],
);

// One logical notification for one destination: a day's grouped reminder or a
// month's overview. The unique period key keeps job reruns and concurrent
// workers from creating or sending it twice. Its ID is the event ID webhook
// receivers deduplicate on.
export const notificationEventTable = pgTable(
  'notification_events',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `evt_${generateId()}`),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    destinationId: text('destination_id').notNull(),
    kind: notificationKindEnum('kind').notNull(),
    // The local reminder date (yyyy-MM-dd) or overview month (yyyy-MM).
    periodKey: text('period_key').notNull(),
    // 9 a.m. on the period's first local day, and the time zone used for it.
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    timeZone: text('time_zone').notNull(),
    status: notificationEventStatusEnum('status').notNull().default('pending'),
    attemptCount: integer('attempt_count').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    // A worker's claim on a `sending` event. A claim that outlives its lease
    // (a crashed worker) can be taken over by the next run.
    leaseToken: text('lease_token'),
    leaseExpiresAt: timestamp('lease_expires_at', { withTimezone: true }),
    // Identifies the exact body of the latest request. A changed body gets a
    // new identity, so a provider idempotency key never covers stale content.
    requestKey: text('request_key'),
    itemCount: integer('item_count'),
    // Resend's ID for an accepted email, and what it has reported since.
    providerMessageId: text('provider_message_id'),
    emailStatus: emailDeliveryStatusEnum('email_status'),
    emailStatusAt: timestamp('email_status_at', { withTimezone: true }),
    lastError: text('last_error'),
    succeededAt: timestamp('succeeded_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique('notification_events_destination_kind_period_unique').on(table.destinationId, table.kind, table.periodKey),

    // Events waiting for an attempt, soonest first
    index('notification_events_status_next_attempt_idx').on(table.status, table.nextAttemptAt),

    // Resend delivery events find their email by provider ID
    uniqueIndex('notification_events_provider_message_id_unique').on(table.providerMessageId),

    foreignKey({
      name: 'notification_events_user_destination_fk',
      columns: [table.userId, table.destinationId],
      foreignColumns: [notificationDestinationTable.userId, notificationDestinationTable.id],
    }).onDelete('cascade'),
  ],
);

// Records which reminder event carries each subscription occurrence for a
// destination. The primary key lets only one event hold an occurrence at a
// time; rows for succeeded events are the "already reminded" history.
export const notificationReminderClaimTable = pgTable(
  'notification_reminder_claims',
  {
    destinationId: text('destination_id')
      .notNull()
      .references(() => notificationDestinationTable.id, { onDelete: 'cascade' }),
    subscriptionId: text('subscription_id')
      .notNull()
      .references(() => subscriptionTable.id, { onDelete: 'cascade' }),
    invoiceDate: date('invoice_date', { mode: 'string' }).notNull(),
    eventId: text('event_id')
      .notNull()
      .references(() => notificationEventTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      name: 'notification_reminder_claims_pk',
      columns: [table.destinationId, table.subscriptionId, table.invoiceDate],
    }),

    // All occurrences carried by this event
    index('notification_reminder_claims_event_id_idx').on(table.eventId),
  ],
);

// One row per send attempt, for delivery health and debugging. Messages are
// sanitized and never include URLs, secrets, or subscription details.
export const notificationAttemptTable = pgTable(
  'notification_attempts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateId()),
    eventId: text('event_id')
      .notNull()
      .references(() => notificationEventTable.id, { onDelete: 'cascade' }),
    attemptNumber: integer('attempt_number').notNull(),
    outcome: notificationAttemptOutcomeEnum('outcome').notNull(),
    statusCode: integer('status_code'),
    message: text('message'),
    requestKey: text('request_key'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // All attempts for this event
    index('notification_attempts_event_id_idx').on(table.eventId),
  ],
);

// Resend webhook message IDs already handled, so redelivered events are ignored.
export const resendWebhookEventTable = pgTable('resend_webhook_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
});
