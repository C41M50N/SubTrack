import { describe, expect, it } from 'vitest';

import { canDeliver, getReminderDestinations } from '@/features/notifications/reminder-setup';
import type { DestinationHealth } from '@/features/notifications/server';

const schedule = { timeZone: 'America/New_York', reminderLeadDays: 3 };

function destination(
  overrides: Partial<{
    paused: boolean;
    health: DestinationHealth;
    renewal_reminder: boolean;
    monthly_overview: boolean;
  }> = {},
) {
  return {
    paused: overrides.paused ?? false,
    health: overrides.health ?? 'ready',
    collectionRoutes: {
      renewal_reminder: overrides.renewal_reminder ?? true,
      monthly_overview: overrides.monthly_overview ?? false,
    },
  };
}

describe('canDeliver', () => {
  it('accepts active destinations, including ones retrying a failure', () => {
    expect(canDeliver({ paused: false, health: 'ready' })).toBe(true);
    expect(canDeliver({ paused: false, health: 'healthy' })).toBe(true);
    expect(canDeliver({ paused: false, health: 'failing' })).toBe(true);
  });

  it('rejects paused and blocked destinations', () => {
    expect(canDeliver({ paused: true, health: 'paused' })).toBe(false);
    expect(canDeliver({ paused: true, health: 'needs_attention' })).toBe(false);
    // Email that is unavailable or unverified is blocked without being paused.
    expect(canDeliver({ paused: false, health: 'needs_attention' })).toBe(false);
  });
});

describe('getReminderDestinations', () => {
  it('returns deliverable destinations with the renewal reminder route on', () => {
    const routed = destination();

    expect(getReminderDestinations({ schedule, destinations: [routed] })).toEqual([routed]);
  });

  it('needs a schedule', () => {
    expect(getReminderDestinations({ schedule: null, destinations: [destination()] })).toEqual([]);
  });

  it('ignores a ready destination without a renewal reminder route', () => {
    const unrouted = destination({ renewal_reminder: false });
    const overviewOnly = destination({ renewal_reminder: false, monthly_overview: true });

    expect(getReminderDestinations({ schedule, destinations: [unrouted, overviewOnly] })).toEqual([]);
  });

  it('ignores routed destinations that are paused or blocked', () => {
    const paused = destination({ paused: true, health: 'paused' });
    const blocked = destination({ health: 'needs_attention' });

    expect(getReminderDestinations({ schedule, destinations: [paused, blocked] })).toEqual([]);
  });
});
