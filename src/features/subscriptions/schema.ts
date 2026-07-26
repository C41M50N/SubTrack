import { z } from 'zod';

import { subscriptionCostFrequencyEnum, subscriptionStatusEnum } from '@/lib/db/subscription-schema';

export const subscriptionStatusSchema = z.enum(subscriptionStatusEnum.enumValues);

export const subscriptionCostFrequencySchema = z.enum(subscriptionCostFrequencyEnum.enumValues);

const subscriptionNameSchema = z.string().trim().min(1, 'Name is required').max(100);
const categorySchema = z.string().trim().min(1, 'Category is required').max(100);
const categoryIdSchema = z.string().min(1, 'Category is required');
const iconRefSchema = z.string().trim().min(1, 'Icon is required').max(200);
/** Postgres int4 upper bound — `cost_amount` is an `integer` column. */
export const MAX_COST_AMOUNT_CENTS = 2_147_483_647;

const costAmountSchema = z
  .number()
  .int()
  .nonnegative('Cost must be zero or more')
  .max(MAX_COST_AMOUNT_CENTS, 'Cost is too large');
const invoiceDateSchema = z.iso.date();

export const subscriptionIdInputSchema = z.object({
  subscriptionId: z.string().min(1),
});

export const listSubscriptionsInputSchema = z
  .object({
    collectionId: z.string().min(1).optional(),
    status: subscriptionStatusSchema.optional(),
  })
  .optional();

export const createSubscriptionInputSchema = z.object({
  name: subscriptionNameSchema,
  collectionId: z.string().min(1),
  iconRef: iconRefSchema,
  categoryId: categoryIdSchema.nullable(),
  costAmount: costAmountSchema,
  costFrequency: subscriptionCostFrequencySchema,
  nextInvoiceDate: invoiceDateSchema,
  status: subscriptionStatusSchema.optional(),
});

export const updateSubscriptionInputSchema = z.object({
  subscriptionId: z.string().min(1),
  name: subscriptionNameSchema.optional(),
  collectionId: z.string().min(1).optional(),
  iconRef: iconRefSchema.optional(),
  categoryId: categoryIdSchema.nullable().optional(),
  costAmount: costAmountSchema.optional(),
  costFrequency: subscriptionCostFrequencySchema.optional(),
  nextInvoiceDate: invoiceDateSchema.optional(),
  status: subscriptionStatusSchema.optional(),
});

export const deleteSubscriptionInputSchema = subscriptionIdInputSchema;

export const moveSubscriptionInputSchema = z.object({
  subscriptionId: z.string().min(1),
  collectionId: z.string().min(1),
});

export const subscriptionTransferFormatSchema = z.enum(['json', 'csv']);

export const exportSubscriptionsInputSchema = z.object({
  format: subscriptionTransferFormatSchema,
  collectionId: z.string().min(1).optional(),
});

const collectionNameSchema = z.string().trim().min(1, 'Collection is required').max(100);
const importCostAmountCentsSchema = z.coerce
  .number()
  .int()
  .nonnegative('Cost must be zero or more')
  .max(MAX_COST_AMOUNT_CENTS, 'Cost is too large');

export const subscriptionImportRowSchema = z.object({
  name: subscriptionNameSchema,
  collection: collectionNameSchema,
  status: subscriptionStatusSchema,
  category: categorySchema,
  iconRef: iconRefSchema,
  costAmountCents: importCostAmountCentsSchema,
  costFrequency: subscriptionCostFrequencySchema,
  nextInvoiceDate: invoiceDateSchema,
});

export type SubscriptionImportRow = z.infer<typeof subscriptionImportRowSchema>;

export const subscriptionImportEnvelopeSchema = z.object({
  type: z.literal('subtrack.subscriptions'),
  version: z.literal(1),
  subscriptions: z.array(subscriptionImportRowSchema),
});

export const importSubscriptionsInputSchema = z.object({
  content: z.string().min(1),
  format: subscriptionTransferFormatSchema.optional(),
});

// Dev-only seeding/clearing operate on a single collection.
export const seedSubscriptionsInputSchema = z.object({
  collectionId: z.string().min(1),
});

export const clearSubscriptionsInputSchema = z.object({
  collectionId: z.string().min(1),
});
