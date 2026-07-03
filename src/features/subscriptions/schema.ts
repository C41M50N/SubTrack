import { z } from 'zod';

import { subscriptionCostFrequencyEnum, subscriptionStatusEnum } from '@/lib/db/subscription-schema';

export const subscriptionStatusSchema = z.enum(subscriptionStatusEnum.enumValues);

export const subscriptionCostFrequencySchema = z.enum(subscriptionCostFrequencyEnum.enumValues);

const subscriptionNameSchema = z.string().trim().min(1, 'Name is required').max(100);
const categorySchema = z.string().trim().min(1, 'Category is required').max(100);
const iconRefSchema = z.string().trim().min(1, 'Icon is required').max(200);
const costAmountSchema = z.number().int().nonnegative();
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
  category: categorySchema,
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
  category: categorySchema.optional(),
  costAmount: costAmountSchema.optional(),
  costFrequency: subscriptionCostFrequencySchema.optional(),
  nextInvoiceDate: invoiceDateSchema.optional(),
  status: subscriptionStatusSchema.optional(),
});

export const deleteSubscriptionInputSchema = subscriptionIdInputSchema;
