import type { Subscription as SubscriptionPrisma } from '@prisma/client';
import { z } from 'zod';
import {
  FREQUENCIES,
  ICONS,
  type SubscriptionFrequency,
  type SubscriptionIcon,
} from '../common';

export type Subscription = SubscriptionPrisma & {
  frequency: SubscriptionFrequency;
  icon_ref: SubscriptionIcon;
};

export const SubscriptionSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(30, { message: 'Name must be at most 30 characters' }),
  amount: z.coerce
    .number()
    .multipleOf(0.01)
    .min(0.01, { message: 'Amount must be at least $0.01' })
    .max(100_000.0, { message: 'Amount must be at most $100,000.00' }),
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

export type SubscriptionId = Subscription['id'];
