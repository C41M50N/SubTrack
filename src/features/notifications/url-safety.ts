// Webhook URLs are user input that the server will request, so they must not
// reach private, loopback, or otherwise internal addresses. URL checks run
// when a destination is saved; address checks run again on every request
// against the addresses DNS returns, and the connection is pinned to them.
// Runs in the browser too, for instant form feedback, so it avoids Node APIs.

export const MAX_WEBHOOK_URL_LENGTH = 2048;

const DISCORD_HOSTS = new Set(['discord.com', 'discordapp.com', 'ptb.discord.com', 'canary.discord.com']);
const DISCORD_WEBHOOK_PATH = /^\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w-]+\/?$/;

// Names that only resolve inside a private network.
const INTERNAL_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home.arpa', '.intranet', '.corp'];

export type WebhookUrlCheck = { ok: true; url: URL } | { ok: false; message: string };

function unbracket(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
}

/** Validates a webhook URL's shape. Does not resolve DNS. */
export function checkWebhookUrl(raw: string, type: 'webhook' | 'discord'): WebhookUrlCheck {
  const value = raw.trim();

  if (value.length > MAX_WEBHOOK_URL_LENGTH) {
    return { ok: false, message: 'URL is too long' };
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return { ok: false, message: 'Enter a valid URL' };
  }

  if (url.protocol !== 'https:') {
    return { ok: false, message: 'URL must start with https://' };
  }

  if (url.username || url.password) {
    return { ok: false, message: 'URL can’t include a username or password' };
  }

  const hostname = unbracket(url.hostname).toLowerCase();

  if (type === 'discord') {
    if (!DISCORD_HOSTS.has(hostname) || !DISCORD_WEBHOOK_PATH.test(url.pathname) || url.port !== '') {
      return { ok: false, message: 'Enter a Discord webhook URL, like https://discord.com/api/webhooks/…' };
    }

    return { ok: true, url };
  }

  if (getIpVersion(hostname) !== 0) {
    return isPublicAddress(hostname) ? { ok: true, url } : { ok: false, message: 'URL must point to a public address' };
  }

  if (
    !hostname.includes('.') ||
    hostname === 'localhost' ||
    INTERNAL_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  ) {
    return { ok: false, message: 'URL must point to a public host' };
  }

  return { ok: true, url };
}

/** Hides a webhook URL's secret parts for display, e.g. "discord.com/api/webhooks/…/••••a1b2". */
export function maskWebhookUrl(raw: string): string {
  try {
    const url = new URL(raw);
    const tail = url.pathname.replace(/\/$/, '').slice(-4);

    return url.pathname.length > 1 ? `${url.host}/…${tail ? `/••••${tail}` : ''}` : url.host;
  } catch {
    return 'Saved URL';
  }
}

function parseIPv4(address: string): number[] | null {
  const parts = address.split('.');

  if (parts.length !== 4) {
    return null;
  }

  const octets = parts.map(Number);

  return parts.every((part) => /^\d{1,3}$/.test(part)) && octets.every((octet) => octet <= 255) ? octets : null;
}

function isPublicIPv4(address: string): boolean {
  const octets = parseIPv4(address);

  if (!octets) {
    return false;
  }

  const [a, b, c] = octets;

  return !(
    (
      a === 0 || // "this" network
      a === 10 || // private
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
      a === 127 || // loopback
      (a === 169 && b === 254) || // link-local, including cloud metadata
      (a === 172 && b >= 16 && b <= 31) || // private
      (a === 192 && b === 0 && c === 0) || // IETF protocol assignments
      (a === 192 && b === 0 && c === 2) || // documentation
      (a === 192 && b === 88 && c === 99) || // 6to4 relay
      (a === 192 && b === 168) || // private
      (a === 198 && (b === 18 || b === 19)) || // benchmarking
      (a === 198 && b === 51 && c === 100) || // documentation
      (a === 203 && b === 0 && c === 113) || // documentation
      a >= 224
    ) // multicast, reserved, and broadcast
  );
}

/** Expands an IPv6 address to eight 16-bit groups, or null if malformed. */
function parseIPv6(address: string): number[] | null {
  if (address.includes('%')) {
    return null;
  }

  let head = address;
  let embeddedV4: number[] = [];
  const lastColon = address.lastIndexOf(':');
  const tail = address.slice(lastColon + 1);

  if (tail.includes('.')) {
    const octets = parseIPv4(tail);

    if (!octets) {
      return null;
    }

    embeddedV4 = [(octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]];
    head = address.slice(0, lastColon + 1);

    if (head.endsWith(':') && !head.endsWith('::')) {
      head = head.slice(0, -1);
    }
  }

  const halves = head.split('::');

  if (halves.length > 2) {
    return null;
  }

  const toGroups = (part: string) =>
    part === ''
      ? []
      : part.split(':').map((group) => (/^[0-9a-f]{1,4}$/i.test(group) ? Number.parseInt(group, 16) : NaN));
  const left = toGroups(halves[0]);
  const right = halves.length === 2 ? toGroups(halves[1]) : [];
  const missing = 8 - left.length - right.length - embeddedV4.length;

  if ((halves.length === 2 && missing < 1) || (halves.length === 1 && missing !== 0)) {
    return null;
  }

  const groups = [...left, ...Array<number>(halves.length === 2 ? missing : 0).fill(0), ...right, ...embeddedV4];

  return groups.length === 8 && groups.every((group) => Number.isInteger(group) && group >= 0 && group <= 0xffff)
    ? groups
    : null;
}

function isPublicIPv6(address: string): boolean {
  const groups = parseIPv6(address);

  if (!groups) {
    return false;
  }

  const embeddedV4 = `${groups[6] >> 8}.${groups[6] & 0xff}.${groups[7] >> 8}.${groups[7] & 0xff}`;

  // IPv4-mapped (::ffff:a.b.c.d) and NAT64 (64:ff9b::a.b.c.d) addresses reach an IPv4 host.
  if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
    return isPublicIPv4(embeddedV4);
  }

  if (groups[0] === 0x64 && groups[1] === 0xff9b && groups.slice(2, 6).every((group) => group === 0)) {
    return isPublicIPv4(embeddedV4);
  }

  const [first, second] = groups;

  // Only global unicast (2000::/3) is public, minus its special-purpose blocks.
  if ((first & 0xe000) !== 0x2000) {
    return false;
  }

  return !(
    (
      (first === 0x2001 && second < 0x0200) || // IETF protocol assignments, including Teredo
      (first === 0x2001 && second === 0x0db8) || // documentation
      first === 0x2002
    ) // 6to4
  );
}

/** 4 or 6 for an IP address literal, 0 for anything else. */
export function getIpVersion(address: string): 0 | 4 | 6 {
  const normalized = unbracket(address);

  if (parseIPv4(normalized)) {
    return 4;
  }

  return normalized.includes(':') && parseIPv6(normalized.toLowerCase()) ? 6 : 0;
}

/** Whether an IP address is safe for the server to connect to. */
export function isPublicAddress(address: string): boolean {
  const normalized = unbracket(address);

  switch (getIpVersion(normalized)) {
    case 4:
      return isPublicIPv4(normalized);
    case 6:
      return isPublicIPv6(normalized.toLowerCase());
    default:
      return false;
  }
}
