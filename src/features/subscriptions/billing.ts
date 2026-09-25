import type { Dayjs, ManipulateType } from 'dayjs';

import type { SubscriptionFrequency } from './constants';

type FrequencyBillingConfig = {
  stepAmount: number;
  stepUnit: ManipulateType;
  displayText: string;
  compactDisplayText: string;
};

export const FREQUENCY_BILLING_CONFIG: Record<SubscriptionFrequency, FrequencyBillingConfig> = {
  weekly: {
    stepAmount: 1,
    stepUnit: 'week',
    displayText: 'week',
    compactDisplayText: 'wk',
  },
  'bi-weekly': {
    stepAmount: 2,
    stepUnit: 'week',
    displayText: '2 weeks',
    compactDisplayText: '2w',
  },
  monthly: {
    stepAmount: 1,
    stepUnit: 'month',
    displayText: 'month',
    compactDisplayText: 'mo',
  },
  'bi-monthly': {
    stepAmount: 2,
    stepUnit: 'month',
    displayText: '2 months',
    compactDisplayText: '2m',
  },
  yearly: {
    stepAmount: 1,
    stepUnit: 'year',
    displayText: 'year',
    compactDisplayText: 'yr',
  },
  'bi-yearly': {
    stepAmount: 2,
    stepUnit: 'year',
    displayText: '2 years',
    compactDisplayText: '2y',
  },
};

export function stepInvoiceDate(dir: 'fwd' | 'bwd', curr: Dayjs, frequency: SubscriptionFrequency): Dayjs {
  const { stepAmount, stepUnit } = FREQUENCY_BILLING_CONFIG[frequency];

  if (dir === 'fwd') {
    return curr.add(stepAmount, stepUnit);
  }
  return curr.subtract(stepAmount, stepUnit);
}

export function getNextInvoiceDate(current: Dayjs, frequency: SubscriptionFrequency, now: Dayjs): Dayjs {
  let nextInvoiceDate = stepInvoiceDate('fwd', current, frequency);

  while (nextInvoiceDate.isBefore(now)) {
    nextInvoiceDate = stepInvoiceDate('fwd', nextInvoiceDate, frequency);
  }

  return nextInvoiceDate;
}

export function frequencyToDisplayText(frequency: SubscriptionFrequency, compact = false): string {
  const config = FREQUENCY_BILLING_CONFIG[frequency];
  return compact ? config.compactDisplayText : config.displayText;
}
