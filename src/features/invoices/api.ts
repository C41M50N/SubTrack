import { createServerFn } from '@tanstack/react-start';

import { requireAuthMiddleware } from '@/features/auth/middleware';
import {
  createSubscriptionInvoiceInputSchema,
  listInvoicesByCollectionInputSchema,
  listInvoicesBySubscriptionInputSchema,
} from '@/features/invoices/schema';
import {
  createSubscriptionInvoice,
  listMyInvoices,
  listMyInvoicesByCollection,
  listMyInvoicesBySubscription,
} from '@/features/invoices/server';

export const listInvoices = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context: { auth } }) => listMyInvoices(auth.userId));

export const listInvoicesByCollection = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .validator(listInvoicesByCollectionInputSchema)
  .handler(async ({ context: { auth }, data }) => listMyInvoicesByCollection(auth.userId, data.collectionId));

export const listInvoicesBySubscription = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .validator(listInvoicesBySubscriptionInputSchema)
  .handler(async ({ context: { auth }, data }) => listMyInvoicesBySubscription(auth.userId, data.subscriptionId));

export const createInvoice = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(createSubscriptionInvoiceInputSchema)
  .handler(async ({ context: { auth }, data }) => {
    return createSubscriptionInvoice({
      userId: auth.userId,
      subscriptionId: data.subscriptionId,
    });
  });
