import { z } from 'zod';

export const listInvoicesBySubscriptionInputSchema = z.object({
  subscriptionId: z.string().min(1),
});

export const listInvoicesByCollectionInputSchema = z.object({
  collectionId: z.string().min(1),
});

export const createSubscriptionInvoiceInputSchema = z.object({
  subscriptionId: z.string().min(1),
});
