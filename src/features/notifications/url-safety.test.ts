import { describe, expect, it } from 'vitest';

import { checkWebhookUrl, getIpVersion, isPublicAddress, maskWebhookUrl } from '@/features/notifications/url-safety';

describe('isPublicAddress', () => {
  it.each([
    '0.0.0.0',
    '10.1.2.3',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.0.0.8',
    '192.0.2.1',
    '192.168.1.1',
    '198.18.0.1',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:10.0.0.1',
    '64:ff9b::a00:1',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1',
    'fe80::1%eth0',
    'ff02::1',
    '2001:db8::1',
    '2001::1',
    '2002:7f00:1::1',
    'not-an-ip',
  ])('blocks %s', (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each([
    '1.1.1.1',
    '8.8.8.8',
    '162.159.136.232',
    '172.32.0.1',
    '2606:4700:4700::1111',
    '::ffff:8.8.8.8',
    '[2a00:1450:4001:80b::200e]',
  ])('allows %s', (address) => {
    expect(isPublicAddress(address)).toBe(true);
  });
});

describe('checkWebhookUrl', () => {
  it('accepts a public HTTPS endpoint', () => {
    expect(checkWebhookUrl('https://hooks.example.com/everysub?token=1', 'webhook').ok).toBe(true);
  });

  it.each([
    ['http://hooks.example.com/everysub', 'https://'],
    ['https://user:pass@hooks.example.com/', 'username or password'],
    ['https://localhost/hook', 'public host'],
    ['https://printer.local/hook', 'public host'],
    ['https://api.internal/hook', 'public host'],
    ['https://intranet/hook', 'public host'],
    ['https://127.0.0.1/hook', 'public address'],
    ['https://2130706433/hook', 'public address'],
    ['https://[::1]/hook', 'public address'],
    ['https://169.254.169.254/latest/meta-data', 'public address'],
    ['not a url', 'valid URL'],
  ])('rejects %s', (url, message) => {
    const check = checkWebhookUrl(url, 'webhook');

    expect(check.ok).toBe(false);
    expect(check.ok ? '' : check.message).toContain(message);
  });

  it('accepts only Discord webhook URLs for Discord', () => {
    expect(checkWebhookUrl('https://discord.com/api/webhooks/123456789/abcDEF-ghi_jkl', 'discord').ok).toBe(true);
    expect(checkWebhookUrl('https://discord.com/api/v10/webhooks/123/token', 'discord').ok).toBe(true);
    expect(checkWebhookUrl('https://discord.com/channels/123/456', 'discord').ok).toBe(false);
    expect(checkWebhookUrl('https://evil.example/api/webhooks/123/token', 'discord').ok).toBe(false);
    expect(checkWebhookUrl('https://discord.com:8443/api/webhooks/123/token', 'discord').ok).toBe(false);
  });
});

describe('maskWebhookUrl', () => {
  it('shows the host and only the last characters of the path', () => {
    expect(maskWebhookUrl('https://discord.com/api/webhooks/123/secret-token-a1b2')).toBe('discord.com/…/••••a1b2');
    expect(maskWebhookUrl('https://hooks.example.com/')).toBe('hooks.example.com');
  });
});

describe('getIpVersion', () => {
  it.each([
    ['8.8.8.8', 4],
    ['[2606:4700::1111]', 6],
    ['::ffff:1.2.3.4', 6],
    ['example.com', 0],
    ['1g::', 0],
    ['256.1.1.1', 0],
    ['1.2.3', 0],
    ['1:2:3:4:5:6:7:8:9', 0],
  ] as const)('reads %s as version %i', (address, version) => {
    expect(getIpVersion(address)).toBe(version);
  });
});
