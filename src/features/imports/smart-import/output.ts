import { z } from 'zod';

import { subscriptionCostFrequencyEnum } from '@/lib/db/subscription-schema';

/** The most items one run returns across both confidence lists. */
export const SMART_IMPORT_MAX_ITEMS = 150;

// OpenAI strict schemas don't support optional properties, so a field the
// agent can't fill is nullable instead.
const smartImportItemSchema = z.object({
  descriptor: z.string().describe('The merchant text exactly as printed on the most recent charge'),
  name: z.string().describe('The merchant or service name a person would recognize'),
  domain: z.string().nullable().describe('The service’s website domain, e.g. "setapp.com". Null when unknown'),
  amountCents: z.number().int().describe('The most recent charge in minor units, e.g. 1299 for 12.99'),
  currency: z.string().describe('ISO 4217 code of the charge, e.g. "USD"'),
  frequency: z.enum(subscriptionCostFrequencyEnum.enumValues).describe('Best guess at the billing frequency'),
  lastChargeDate: z.string().describe('Date of the most recent charge as YYYY-MM-DD'),
  category: z.string().describe('An existing category name, or a proposed one when none fits'),
  reason: z.string().describe('One line explaining the item and its confidence'),
});

export const smartImportOutputSchema = z.object({
  highConfidence: z.array(smartImportItemSchema),
  lowConfidence: z.array(smartImportItemSchema),
});

export type SmartImportItem = z.infer<typeof smartImportItemSchema>;
export type SmartImportOutput = z.infer<typeof smartImportOutputSchema>;
