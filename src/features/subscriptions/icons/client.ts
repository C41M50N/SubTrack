import { ENV } from 'varlock/env';

/**
 * Builds a logo.dev image URL for a domain. Returns null when no publishable
 * key is configured or the domain is empty, so callers can fall back to
 * initials. `fallback=404` makes logo.dev return an error (instead of a
 * monogram) for unknown domains, which lets the <img> onError handler kick in.
 *
 * The publishable key is read from `varlock/env` (not `import.meta.env`):
 * varlock injects env at runtime and only exposes non-sensitive values through
 * `ENV`, on both the server and the client.
 */
export function buildLogoImageUrl(domain: string, size = 64): string | null {
  const token = ENV.LOGO_DEV_PUBLISHABLE_KEY;
  const trimmed = domain.trim();

  if (!token || trimmed.length === 0) {
    return null;
  }

  const url = new URL(`https://img.logo.dev/${encodeURIComponent(trimmed)}`);
  url.searchParams.set('token', token);
  url.searchParams.set('size', String(size));
  url.searchParams.set('format', 'png');
  url.searchParams.set('retina', 'true');
  url.searchParams.set('fallback', '404');

  return url.toString();
}

export function initialsFromName(name: string): string {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return '?';
  }

  const words = trimmed.split(/\s+/).slice(0, 2);
  const initials = words.map((word) => word[0]).join('');

  return initials.toUpperCase();
}
