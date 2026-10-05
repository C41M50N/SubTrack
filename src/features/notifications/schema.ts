import { z } from 'zod';

import { normalizeTimeZone } from '@/features/notifications/time';
import { MAX_WEBHOOK_URL_LENGTH } from '@/features/notifications/url-safety';
import { MAX_REMINDER_LEAD_DAYS, MIN_REMINDER_LEAD_DAYS, notificationKindEnum } from '@/lib/db/notification-schema';

export const notificationKindSchema = z.enum(notificationKindEnum.enumValues);

export const timeZoneSchema = z
  .string({ error: 'Choose a time zone' })
  .trim()
  .min(1, 'Choose a time zone')
  .max(100)
  .refine((value) => normalizeTimeZone(value) !== null, 'Choose a valid time zone');

export const reminderLeadDaysSchema = z
  .number({ error: 'Choose a lead time' })
  .int()
  .min(MIN_REMINDER_LEAD_DAYS, `Lead time must be at least ${MIN_REMINDER_LEAD_DAYS} day`)
  .max(MAX_REMINDER_LEAD_DAYS, `Lead time can be at most ${MAX_REMINDER_LEAD_DAYS} days`);

export const saveNotificationScheduleInputSchema = z.object({
  timeZone: timeZoneSchema,
  reminderLeadDays: reminderLeadDaysSchema,
});

export const destinationNameSchema = z
  .string({ error: 'Name is required' })
  .trim()
  .min(1, 'Name is required')
  .max(60, 'Name must be 60 characters or fewer');

const webhookUrlSchema = z
  .string({ error: 'URL is required' })
  .trim()
  .min(1, 'URL is required')
  .max(MAX_WEBHOOK_URL_LENGTH, 'URL is too long');

export const webhookDestinationTypeSchema = z.enum(['webhook', 'discord']);

export const createWebhookDestinationInputSchema = z.object({
  type: webhookDestinationTypeSchema,
  name: destinationNameSchema,
  url: webhookUrlSchema,
});

export const createEmailDestinationInputSchema = z.object({
  name: destinationNameSchema,
});

export const destinationIdInputSchema = z.object({
  destinationId: z.string().min(1),
});

export const updateDestinationInputSchema = destinationIdInputSchema.extend({
  name: destinationNameSchema,
  // Omitted to keep the saved URL, which is never sent back to the browser.
  url: webhookUrlSchema.optional(),
});

export const setDestinationPausedInputSchema = destinationIdInputSchema.extend({
  paused: z.boolean(),
});

export const sendTestNotificationInputSchema = destinationIdInputSchema.extend({
  kind: notificationKindSchema,
});

export const collectionNotificationsInputSchema = z.object({
  collectionId: z.string().min(1),
});

const inclusionChangeSchema = z.object({
  subscriptionId: z.string().min(1),
  included: z.boolean(),
});

export const setRouteInputSchema = z.object({
  collectionId: z.string().min(1),
  destinationId: z.string().min(1),
  kind: notificationKindSchema,
  enabled: z.boolean(),
  // Inclusion choices confirmed while reviewing the collection's subscriptions.
  // Required the first time a collection routes anything to a destination.
  reviewedInclusion: z.array(inclusionChangeSchema).max(1000).optional(),
});

export const setSubscriptionsInclusionInputSchema = z.object({
  subscriptionIds: z
    .array(z.string().min(1))
    .min(1)
    .max(500)
    .refine((ids) => new Set(ids).size === ids.length, 'Subscription IDs must be unique'),
  included: z.boolean(),
});
