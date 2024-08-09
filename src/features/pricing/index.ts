
type PricingTier = {
  title: string;
  cost: number;
  subtitle: string;
  features: Array<string>;
}

export const pricingInfo: Array<PricingTier> = [
  {
    cost: 0,
    title: 'Free',
    subtitle: 'free forever.',
    features: [
      'up to 10 subscriptions per collection',
      '1 collection',
    ]
  },
  {
    cost: 10,
    title: 'Basic',
    subtitle: 'good enough for most people.',
    features: [
      'up to 50 subscriptions per collection',
      'up to 2 collections'
    ]
  },
  {
    cost: 25,
    title: 'Pro',
    subtitle: 'for power users (or chronic spenders).',
    features: [
      'unlimited subscriptions per collection',
      'up to 15 collections'
    ]
  }
]
