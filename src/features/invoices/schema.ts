import { z } from 'zod';

export const listInvoicesBySubscriptionInputSchema = z.object({
  subscriptionId: z.string().min(1),
});

export const createSubscriptionInvoiceInputSchema = z.object({
  subscriptionId: z.string().min(1),
});
