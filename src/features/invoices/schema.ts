import { z } from 'zod';

export const listInvoicesBySubscriptionInputSchema = z.object({
  subscriptionId: z.string().min(1),
});

export const listInvoicesByCollectionInputSchema = z
  .object({
    collectionId: z.string().min(1),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  })
  .refine((input) => input.startDate < input.endDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const createSubscriptionInvoiceInputSchema = z.object({
  subscriptionId: z.string().min(1),
});
