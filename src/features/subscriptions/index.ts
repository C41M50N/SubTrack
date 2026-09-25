import type { Subscription as SubscriptionPrisma } from '@prisma/client';
import { z } from 'zod';

import { FREQUENCIES, ICONS, type SubscriptionFrequency, type SubscriptionIcon } from './constants';

const SUBSCRIPTION_NAME_MIN_LENGTH = 2;
const SUBSCRIPTION_NAME_MAX_LENGTH = 30;
const SUBSCRIPTION_AMOUNT_STEP = 0.01;
const SUBSCRIPTION_AMOUNT_MIN = 0.01;
const SUBSCRIPTION_AMOUNT_MAX = 100_000.0;

export type Subscription = SubscriptionPrisma & {
  frequency: SubscriptionFrequency;
  icon_ref: SubscriptionIcon;
};

export const SubscriptionSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(SUBSCRIPTION_NAME_MIN_LENGTH, {
      message: 'Name must be at least 2 characters',
    })
    .max(SUBSCRIPTION_NAME_MAX_LENGTH, {
      message: 'Name must be at most 30 characters',
    }),
  amount: z.coerce
    .number()
    .multipleOf(SUBSCRIPTION_AMOUNT_STEP)
    .min(SUBSCRIPTION_AMOUNT_MIN, { message: 'Amount must be at least $0.01' })
    .max(SUBSCRIPTION_AMOUNT_MAX, {
      message: 'Amount must be at most $100,000.00',
    }),
  frequency: z.enum(FREQUENCIES),
  category: z.string(),
  icon_ref: z.enum(ICONS),
  next_invoice: z.date(),
  send_alert: z.boolean(),
  collection_id: z.string(),
});

export const CreateSubscriptionSchema = SubscriptionSchema.omit({
  id: true,
});

export const MoveSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  destinationCollectionId: z.string(),
});

export type SubscriptionId = Subscription['id'];
