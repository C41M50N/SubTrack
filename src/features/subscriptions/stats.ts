import type { SubscriptionFrequency } from './constants';

type SubscriptionCostInput = {
  amount: number;
  frequency: SubscriptionFrequency;
};

export type StatisticItem = {
  description: string;
  getResult: (subscriptions: SubscriptionCostInput[]) => number;
};

type CostPeriod = 'week' | 'month' | 'year';

const WEEKS_PER_MONTH = 4.3;
const WEEKS_PER_YEAR = 52.0;
const MONTHS_PER_YEAR = 12.0;
const BI_FREQUENCY_DIVISOR = 2.0;
const ZERO_COST = 0.0;

const frequencyCostMultipliers: Record<
  SubscriptionFrequency,
  Record<CostPeriod, number>
> = {
  weekly: {
    week: 1,
    month: WEEKS_PER_MONTH,
    year: WEEKS_PER_YEAR,
  },
  'bi-weekly': {
    week: 1 / BI_FREQUENCY_DIVISOR,
    month: WEEKS_PER_MONTH / BI_FREQUENCY_DIVISOR,
    year: WEEKS_PER_YEAR / BI_FREQUENCY_DIVISOR,
  },
  monthly: {
    week: 1 / WEEKS_PER_MONTH,
    month: 1,
    year: MONTHS_PER_YEAR,
  },
  'bi-monthly': {
    week: 1 / (WEEKS_PER_MONTH * BI_FREQUENCY_DIVISOR),
    month: 1 / BI_FREQUENCY_DIVISOR,
    year: MONTHS_PER_YEAR / BI_FREQUENCY_DIVISOR,
  },
  yearly: {
    week: 1 / WEEKS_PER_YEAR,
    month: 1 / MONTHS_PER_YEAR,
    year: 1,
  },
  'bi-yearly': {
    week: 1 / (WEEKS_PER_YEAR * BI_FREQUENCY_DIVISOR),
    month: 1 / (MONTHS_PER_YEAR * BI_FREQUENCY_DIVISOR),
    year: 1 / BI_FREQUENCY_DIVISOR,
  },
};

function getSubscriptionsCostForPeriod(
  subscriptions: SubscriptionCostInput[],
  period: CostPeriod
): number {
  return subscriptions.reduce((total, subscription) => {
    return (
      total +
      subscription.amount *
        frequencyCostMultipliers[subscription.frequency][period]
    );
  }, ZERO_COST);
}

export const Statistics: StatisticItem[] = [
  {
    description: 'cost per week',
    getResult: (subscriptions) =>
      getSubscriptionsCostForPeriod(subscriptions, 'week'),
  },
  {
    description: 'cost per month',
    getResult: (subscriptions) =>
      getSubscriptionsCostForPeriod(subscriptions, 'month'),
  },
  {
    description: 'cost per year',
    getResult: (subscriptions) =>
      getSubscriptionsCostForPeriod(subscriptions, 'year'),
  },
];
