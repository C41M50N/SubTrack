import { createServerFn } from '@tanstack/react-start';

import { requireAuthMiddleware } from '@/features/auth/middleware';
import { parseSubscriptionImport } from '@/features/subscriptions/import';
import {
  clearSubscriptionsInputSchema,
  createSubscriptionInputSchema,
  deleteSubscriptionInputSchema,
  importSubscriptionsInputSchema,
  listSubscriptionsInputSchema,
  moveSubscriptionInputSchema,
  seedSubscriptionsInputSchema,
  updateSubscriptionInputSchema,
} from '@/features/subscriptions/schema';
import {
  clearMySubscriptions,
  createMySubscription,
  deleteMySubscription,
  importMySubscriptions,
  listMySubscriptions,
  moveMySubscription,
  seedMySubscriptions,
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
      categoryId: data.categoryId,
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
      categoryId: data.categoryId,
      costAmount: data.costAmount,
      costFrequency: data.costFrequency,
      nextInvoiceDate: data.nextInvoiceDate,
      status: data.status,
    });
  });

export const moveSubscription = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(moveSubscriptionInputSchema)
  .handler(async ({ context: { auth }, data }) => {
    return moveMySubscription({
      userId: auth.userId,
      subscriptionId: data.subscriptionId,
      collectionId: data.collectionId,
    });
  });

export const importSubscriptions = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(importSubscriptionsInputSchema)
  .handler(async ({ context: { auth }, data }) => {
    const rows = parseSubscriptionImport({ content: data.content, format: data.format });

    return importMySubscriptions({ userId: auth.userId, rows });
  });

export const seedSubscriptions = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(seedSubscriptionsInputSchema)
  .handler(async ({ context: { auth }, data }) => {
    return seedMySubscriptions({ userId: auth.userId, collectionId: data.collectionId });
  });

export const clearSubscriptions = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(clearSubscriptionsInputSchema)
  .handler(async ({ context: { auth }, data }) => {
    return clearMySubscriptions({ userId: auth.userId, collectionId: data.collectionId });
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
