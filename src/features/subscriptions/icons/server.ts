import { ENV } from 'varlock/env';

export type BrandSearchResult = {
  name: string;
  domain: string;
  logoUrl: string;
};

type LogoDevSearchItem = {
  name?: string;
  domain?: string;
  logo_url?: string;
};

/**
 * Looks up brand domains by name via the logo.dev Search API. Requires the
 * secret key; when it is not configured (or the request fails) we return an
 * empty list so the icon picker degrades to manual domain entry.
 */
export async function searchBrands(query: string): Promise<BrandSearchResult[]> {
  const token = ENV.LOGO_DEV_SECRET_KEY;
  const trimmed = query.trim();

  if (!token || trimmed.length === 0) {
    return [];
  }

  const url = new URL('https://api.logo.dev/search');
  url.searchParams.set('q', trimmed);

  let response: Response;

  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const items = (await response.json()) as LogoDevSearchItem[];

  return items
    .filter((item): item is LogoDevSearchItem & { domain: string } => Boolean(item.domain))
    .map((item) => ({
      name: item.name ?? item.domain,
      domain: item.domain,
      logoUrl: item.logo_url ?? '',
    }));
}
