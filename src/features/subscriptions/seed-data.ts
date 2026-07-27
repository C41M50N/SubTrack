import { addDays, format } from 'date-fns';

import type { SubscriptionCostFrequency } from '@/features/subscriptions/server';

// Static seed subscription. Every field is fixed except `nextInvoiceDate`,
// which is generated per cadence when the seeder runs (see buildSeedSubscriptions).
// `iconRef` is a bare brand domain (e.g. "netflix.com") resolved via logo.dev at
// render time; an imperfect domain simply falls back to initials, so seeds are safe.
type SeedSubscription = {
  name: string;
  category: string;
  iconRef: string;
  // Price in cents (e.g. 1549 = $15.49).
  costAmountCents: number;
  costFrequency: SubscriptionCostFrequency;
};

// A seed subscription with the runtime-generated invoice date attached. All seeds
// are created as 'active'.
export type SeedSubscriptionRow = SeedSubscription & {
  status: 'active';
  nextInvoiceDate: string;
};

export const SEED_SUBSCRIPTIONS: SeedSubscription[] = [
  { name: 'Netflix', category: 'Streaming', iconRef: 'netflix.com', costAmountCents: 1549, costFrequency: 'monthly' },
  {
    name: 'Disney+',
    category: 'Streaming',
    iconRef: 'disneyplus.com',
    costAmountCents: 1399,
    costFrequency: 'monthly',
  },
  { name: 'Hulu', category: 'Streaming', iconRef: 'hulu.com', costAmountCents: 1799, costFrequency: 'monthly' },
  { name: 'Max', category: 'Streaming', iconRef: 'max.com', costAmountCents: 1599, costFrequency: 'monthly' },
  {
    name: 'Paramount+',
    category: 'Streaming',
    iconRef: 'paramountplus.com',
    costAmountCents: 1199,
    costFrequency: 'monthly',
  },
  { name: 'Apple TV+', category: 'Streaming', iconRef: 'tv.apple.com', costAmountCents: 999, costFrequency: 'monthly' },
  {
    name: 'Amazon Prime',
    category: 'Streaming',
    iconRef: 'amazon.com',
    costAmountCents: 13900,
    costFrequency: 'yearly',
  },
  { name: 'Spotify', category: 'Music', iconRef: 'spotify.com', costAmountCents: 1199, costFrequency: 'monthly' },
  {
    name: 'Apple Music',
    category: 'Music',
    iconRef: 'music.apple.com',
    costAmountCents: 1099,
    costFrequency: 'monthly',
  },
  {
    name: 'YouTube Premium',
    category: 'Music',
    iconRef: 'youtube.com',
    costAmountCents: 1399,
    costFrequency: 'monthly',
  },
  { name: 'Tidal', category: 'Music', iconRef: 'tidal.com', costAmountCents: 1099, costFrequency: 'monthly' },
  { name: 'Notion', category: 'Productivity', iconRef: 'notion.so', costAmountCents: 1000, costFrequency: 'monthly' },
  { name: 'Slack', category: 'Productivity', iconRef: 'slack.com', costAmountCents: 875, costFrequency: 'monthly' },
  { name: 'Todoist', category: 'Productivity', iconRef: 'todoist.com', costAmountCents: 500, costFrequency: 'monthly' },
  {
    name: 'Grammarly',
    category: 'Productivity',
    iconRef: 'grammarly.com',
    costAmountCents: 1200,
    costFrequency: 'monthly',
  },
  {
    name: '1Password',
    category: 'Productivity',
    iconRef: '1password.com',
    costAmountCents: 3588,
    costFrequency: 'yearly',
  },
  {
    name: 'GitHub',
    category: 'Developer Tools',
    iconRef: 'github.com',
    costAmountCents: 400,
    costFrequency: 'monthly',
  },
  { name: 'Figma', category: 'Developer Tools', iconRef: 'figma.com', costAmountCents: 1500, costFrequency: 'monthly' },
  {
    name: 'Vercel',
    category: 'Developer Tools',
    iconRef: 'vercel.com',
    costAmountCents: 2000,
    costFrequency: 'monthly',
  },
  {
    name: 'Linear',
    category: 'Developer Tools',
    iconRef: 'linear.app',
    costAmountCents: 800,
    costFrequency: 'monthly',
  },
  {
    name: 'Adobe CC',
    category: 'Developer Tools',
    iconRef: 'adobe.com',
    costAmountCents: 5999,
    costFrequency: 'monthly',
  },
  {
    name: 'NordVPN',
    category: 'Developer Tools',
    iconRef: 'nordvpn.com',
    costAmountCents: 8900,
    costFrequency: 'biennially',
  },
  { name: 'ChatGPT Plus', category: 'AI', iconRef: 'openai.com', costAmountCents: 2000, costFrequency: 'monthly' },
  { name: 'Claude Pro', category: 'AI', iconRef: 'claude.ai', costAmountCents: 2000, costFrequency: 'monthly' },
  { name: 'Perplexity Pro', category: 'AI', iconRef: 'perplexity.ai', costAmountCents: 2000, costFrequency: 'monthly' },
  { name: 'Midjourney', category: 'AI', iconRef: 'midjourney.com', costAmountCents: 1000, costFrequency: 'monthly' },
  {
    name: 'Dropbox',
    category: 'Cloud Storage',
    iconRef: 'dropbox.com',
    costAmountCents: 1199,
    costFrequency: 'monthly',
  },
  {
    name: 'Google One',
    category: 'Cloud Storage',
    iconRef: 'one.google.com',
    costAmountCents: 199,
    costFrequency: 'monthly',
  },
  { name: 'iCloud+', category: 'Cloud Storage', iconRef: 'icloud.com', costAmountCents: 299, costFrequency: 'monthly' },
  { name: 'NYTimes', category: 'News', iconRef: 'nytimes.com', costAmountCents: 1700, costFrequency: 'monthly' },
];

// How far ahead each cadence's next invoice can land. Dates are spread randomly
// within the cadence window so upcoming-invoice UI has a realistic distribution.
const CADENCE_WINDOW_DAYS: Record<SubscriptionCostFrequency, number> = {
  weekly: 7,
  monthly: 30,
  yearly: 365,
  biennially: 730,
};

function randomInvoiceDate(costFrequency: SubscriptionCostFrequency): string {
  const window = CADENCE_WINDOW_DAYS[costFrequency];
  const offset = Math.floor(Math.random() * (window + 1));

  return format(addDays(new Date(), offset), 'yyyy-MM-dd');
}

// Materialize the seed list with freshly generated invoice dates. Called once per
// seed run so re-seeding produces a new spread of dates.
export function buildSeedSubscriptions(): SeedSubscriptionRow[] {
  return SEED_SUBSCRIPTIONS.map((subscription) => ({
    ...subscription,
    status: 'active',
    nextInvoiceDate: randomInvoiceDate(subscription.costFrequency),
  }));
}
