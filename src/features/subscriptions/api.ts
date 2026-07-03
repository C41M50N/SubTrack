import { createServerFn } from '@tanstack/react-start';

import { requireAuthMiddleware } from '@/features/auth/middleware';
import {
  createSubscriptionInputSchema,
  deleteSubscriptionInputSchema,
  listSubscriptionsInputSchema,
  updateSubscriptionInputSchema,
} from '@/features/subscriptions/schema';
import {
  createMySubscription,
  deleteMySubscription,
  listMySubscriptions,
  updateMySubscription,
} from '@/features/subscriptions/server';

export const listSubscriptions = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .validator(listSubscriptionsInputSchema)
  .handler(async ({ context: { auth }, data }) => listMySubscriptions(auth.userId, data));

export const createSubscription = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(createSubscriptionInputSchema)
  .handler(async ({ context: { auth }, data }) => {
    return createMySubscription({
      userId: auth.userId,
      name: data.name,
      collectionId: data.collectionId,
      iconRef: data.iconRef,
      category: data.category,
      costAmount: data.costAmount,
      costFrequency: data.costFrequency,
      nextInvoiceDate: data.nextInvoiceDate,
      status: data.status,
    });
  });

export const updateSubscription = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(updateSubscriptionInputSchema)
  .handler(async ({ context: { auth }, data }) => {
    return updateMySubscription({
      userId: auth.userId,
      subscriptionId: data.subscriptionId,
      name: data.name,
      collectionId: data.collectionId,
      iconRef: data.iconRef,
      category: data.category,
      costAmount: data.costAmount,
      costFrequency: data.costFrequency,
      nextInvoiceDate: data.nextInvoiceDate,
      status: data.status,
    });
  });

export const deleteSubscription = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(deleteSubscriptionInputSchema)
  .handler(async ({ context: { auth }, data }) => {
    return deleteMySubscription({
      userId: auth.userId,
      subscriptionId: data.subscriptionId,
    });
  });
