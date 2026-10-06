import { toCategoryNameKey } from '@/features/categories/names';

export type PopularService = {
  name: string;
  /** Brand domain, saved as the subscription's icon. */
  domain: string;
  /** What the service is, shown under its name. */
  kind: string;
  /** Starter category it belongs in, matched by name in the collection. */
  category: string;
  /** Other names people search for it by. */
  aliases?: string[];
};

/**
 * Services people commonly pay for, so adding one starts from a name and logo
 * instead of a blank form. Prices are left out on purpose: plans vary too much
 * to guess, and the user fills in what they actually pay.
 *
 * The first few are the quick-add suggestions shown before any search.
 */
export const POPULAR_SERVICES: PopularService[] = [
  { name: 'Netflix', domain: 'netflix.com', kind: 'Streaming', category: 'Entertainment' },
  { name: 'Spotify', domain: 'spotify.com', kind: 'Music', category: 'Entertainment' },
  { name: 'iCloud+', domain: 'icloud.com', kind: 'Cloud storage', category: 'Utilities', aliases: ['iCloud'] },
  {
    name: 'YouTube Premium',
    domain: 'youtube.com',
    kind: 'Video and music',
    category: 'Entertainment',
    aliases: ['YouTube', 'YouTube Music'],
  },
  {
    name: 'Amazon Prime',
    domain: 'amazon.com',
    kind: 'Shopping and video',
    category: 'Entertainment',
    aliases: ['Prime', 'Prime Video'],
  },
  { name: 'Disney+', domain: 'disneyplus.com', kind: 'Streaming', category: 'Entertainment', aliases: ['Disney Plus'] },
  { name: 'Max', domain: 'max.com', kind: 'Streaming', category: 'Entertainment', aliases: ['HBO', 'HBO Max'] },
  { name: 'Hulu', domain: 'hulu.com', kind: 'Streaming', category: 'Entertainment' },
  { name: 'Apple TV+', domain: 'tv.apple.com', kind: 'Streaming', category: 'Entertainment', aliases: ['Apple TV'] },
  {
    name: 'Paramount+',
    domain: 'paramountplus.com',
    kind: 'Streaming',
    category: 'Entertainment',
    aliases: ['Paramount Plus'],
  },
  { name: 'Peacock', domain: 'peacocktv.com', kind: 'Streaming', category: 'Entertainment' },
  { name: 'Apple Music', domain: 'music.apple.com', kind: 'Music', category: 'Entertainment' },
  { name: 'Audible', domain: 'audible.com', kind: 'Audiobooks', category: 'Entertainment' },
  {
    name: 'Xbox Game Pass',
    domain: 'xbox.com',
    kind: 'Gaming',
    category: 'Entertainment',
    aliases: ['Xbox', 'Game Pass'],
  },
  {
    name: 'PlayStation Plus',
    domain: 'playstation.com',
    kind: 'Gaming',
    category: 'Entertainment',
    aliases: ['PlayStation', 'PS Plus'],
  },
  {
    name: 'Nintendo Switch Online',
    domain: 'nintendo.com',
    kind: 'Gaming',
    category: 'Entertainment',
    aliases: ['Nintendo'],
  },
  {
    name: 'ChatGPT Plus',
    domain: 'chatgpt.com',
    kind: 'AI assistant',
    category: 'Productivity',
    aliases: ['ChatGPT', 'OpenAI'],
  },
  {
    name: 'Claude Pro',
    domain: 'claude.ai',
    kind: 'AI assistant',
    category: 'Productivity',
    aliases: ['Claude', 'Anthropic'],
  },
  {
    name: 'Microsoft 365',
    domain: 'microsoft.com',
    kind: 'Office apps',
    category: 'Productivity',
    aliases: ['Office', 'Microsoft Office', 'Outlook'],
  },
  {
    name: 'Adobe Creative Cloud',
    domain: 'adobe.com',
    kind: 'Creative apps',
    category: 'Productivity',
    aliases: ['Adobe', 'Photoshop', 'Lightroom'],
  },
  {
    name: 'GitHub Copilot',
    domain: 'github.com',
    kind: 'Coding assistant',
    category: 'Productivity',
    aliases: ['GitHub', 'Copilot'],
  },
  { name: 'Notion', domain: 'notion.so', kind: 'Notes and docs', category: 'Productivity' },
  {
    name: 'Google One',
    domain: 'google.com',
    kind: 'Cloud storage',
    category: 'Utilities',
    aliases: ['Google Drive', 'Google storage'],
  },
  { name: 'Dropbox', domain: 'dropbox.com', kind: 'Cloud storage', category: 'Utilities' },
  { name: '1Password', domain: '1password.com', kind: 'Password manager', category: 'Utilities' },
  { name: 'Duolingo', domain: 'duolingo.com', kind: 'Language learning', category: 'Education' },
  {
    name: 'The New York Times',
    domain: 'nytimes.com',
    kind: 'News',
    category: 'Miscellaneous',
    aliases: ['New York Times', 'NYT'],
  },
  { name: 'Strava', domain: 'strava.com', kind: 'Fitness', category: 'Health' },
  { name: 'Peloton', domain: 'onepeloton.com', kind: 'Fitness', category: 'Health' },
  { name: 'Headspace', domain: 'headspace.com', kind: 'Meditation', category: 'Health' },
  {
    name: 'Uber One',
    domain: 'uber.com',
    kind: 'Rides and delivery',
    category: 'Miscellaneous',
    aliases: ['Uber', 'Uber Eats'],
  },
  {
    name: 'DoorDash DashPass',
    domain: 'doordash.com',
    kind: 'Food delivery',
    category: 'Miscellaneous',
    aliases: ['DoorDash', 'DashPass'],
  },
];

/** How many services the quick-add list shows at once. */
export const QUICK_ADD_LIMIT = 4;

/** Compares names by their letters and digits, so "iCloud+" matches "icloud". */
function toSearchKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function namesOf(service: PopularService): string[] {
  return [service.name, ...(service.aliases ?? [])];
}

/** Lower is better: a name that starts with the query, then a word that does, then anywhere. */
function rankMatch(service: PopularService, queryKey: string): number | null {
  let best: number | null = null;

  for (const name of namesOf(service)) {
    const rank = toSearchKey(name).startsWith(queryKey)
      ? 0
      : name.split(/\s+/).some((word) => toSearchKey(word).startsWith(queryKey))
        ? 1
        : toSearchKey(name).includes(queryKey)
          ? 2
          : null;

    if (rank !== null && (best === null || rank < best)) {
      best = rank;
    }
  }

  return best;
}

export type ServiceSearchResult = {
  services: PopularService[];
  /** Whether a service is named exactly what was typed, so it needn't be offered as a custom name. */
  exactMatch: boolean;
};

/**
 * Finds popular services by name or alias. An empty query returns the default
 * suggestions. Matches keep catalog order within each rank, so better-known
 * services come first.
 */
export function searchPopularServices(query: string, limit = QUICK_ADD_LIMIT): ServiceSearchResult {
  const queryKey = toSearchKey(query);

  if (queryKey.length === 0) {
    return { services: POPULAR_SERVICES.slice(0, limit), exactMatch: false };
  }

  const ranked = POPULAR_SERVICES.flatMap((service) => {
    const rank = rankMatch(service, queryKey);

    return rank === null ? [] : [{ service, rank }];
  }).sort((a, b) => a.rank - b.rank);

  return {
    services: ranked.slice(0, limit).map(({ service }) => service),
    exactMatch: ranked.some(({ service }) => namesOf(service).some((name) => toSearchKey(name) === queryKey)),
  };
}

function toWordKeys(value: string): string[] {
  return value.split(/\s+/).map(toSearchKey).filter(Boolean);
}

/**
 * The subscription already tracking a service: one named after it, an alias,
 * or its name plus a plan, like "Netflix Premium". Domains aren't compared,
 * since one brand domain can cover several services.
 */
export function findTrackedSubscription<Subscription extends { name: string }>(
  service: PopularService,
  subscriptions: Subscription[],
): Subscription | undefined {
  const serviceWords = toWordKeys(service.name);
  const aliasKeys = new Set((service.aliases ?? []).map(toSearchKey));

  return subscriptions.find((subscription) => {
    const words = toWordKeys(subscription.name);

    return serviceWords.every((word, index) => words[index] === word) || aliasKeys.has(toSearchKey(subscription.name));
  });
}

/** A subscription with this name, ignoring case and punctuation. */
export function findSubscriptionNamed<Subscription extends { name: string }>(
  name: string,
  subscriptions: Subscription[],
): Subscription | undefined {
  const key = toSearchKey(name);

  return subscriptions.find((subscription) => toSearchKey(subscription.name) === key);
}

/** The collection's category for a service, if the collection still has one by that name. */
export function findServiceCategoryId(
  service: PopularService,
  categories: { id: string; name: string }[],
): string | null {
  const key = toCategoryNameKey(service.category);

  return categories.find((category) => toCategoryNameKey(category.name) === key)?.id ?? null;
}
