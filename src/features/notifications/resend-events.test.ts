import { describe, expect, it } from 'vitest';

import { toEmailDeliveryStatus } from '@/features/notifications/resend-events';

describe('toEmailDeliveryStatus', () => {
  it.each([
    ['email.sent', 'accepted'],
    ['email.delivered', 'delivered'],
    ['email.delivery_delayed', 'delayed'],
    ['email.complained', 'complained'],
    ['email.suppressed', 'suppressed'],
    ['email.failed', 'failed'],
  ])('maps %s to %s', (type, status) => {
    expect(toEmailDeliveryStatus({ type })).toBe(status);
  });

  it('only treats a permanent bounce as a rejection', () => {
    expect(toEmailDeliveryStatus({ type: 'email.bounced', data: { bounce: { type: 'Permanent' } } })).toBe('bounced');
    expect(toEmailDeliveryStatus({ type: 'email.bounced', data: { bounce: { type: 'Transient' } } })).toBe('delayed');
  });

  it('ignores recipient activity', () => {
    expect(toEmailDeliveryStatus({ type: 'email.opened' })).toBeNull();
    expect(toEmailDeliveryStatus({ type: 'email.clicked' })).toBeNull();
  });
});
