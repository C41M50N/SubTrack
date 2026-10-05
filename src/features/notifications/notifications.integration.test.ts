import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpResult } from '@/features/notifications/http';

// Runs against a disposable local Postgres with the current schema pushed:
//   TEST_DATABASE_URL=postgresql://postgres@localhost:54329/everysub_test bun run test
// Every table is truncated between tests, so this refuses any non-local URL.
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const isLocalDatabase = Boolean(TEST_DATABASE_URL?.match(/@(localhost|127\.0\.0\.1)(:\d+)?\//));

vi.mock('@/lib/db', async () => {
  const { drizzle } = await import('drizzle-orm/node-postgres');

  return { db: drizzle(process.env.TEST_DATABASE_URL ?? 'postgresql://invalid@localhost:1/none') };
});

const postToWebhook =
  vi.fn<(input: { url: string; body: string; headers: Record<string, string> }) => Promise<HttpResult>>();

vi.mock('@/features/notifications/http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/notifications/http')>()),
  postToWebhook: (input: { url: string; body: string; headers: Record<string, string> }) => postToWebhook(input),
}));

const sendNotificationEmail = vi.fn();
const getEmailAvailability = vi.fn();

vi.mock('@/features/notifications/resend', () => ({
  getEmailAvailability: () => getEmailAvailability(),
  sendNotificationEmail: (input: unknown) => sendNotificationEmail(input),
  getResendWebhookSecret: () => null,
}));

const { db } = await import('@/lib/db');
const schema = await import('@/lib/db/schema');
const { scheduleDueNotifications } = await import('@/features/notifications/scheduler');
const { deliverDueNotifications } = await import('@/features/notifications/delivery');
const { handleResendEvent } = await import('@/features/notifications/resend-events');
const { applyInclusion } = await import('@/features/notifications/inclusion');
const { recordDueInvoices } = await import('@/jobs/due-invoices');
const server = await import('@/features/notifications/server');

const LONG_AGO = new Date('2026-01-01T00:00:00Z');
const ok: HttpResult = { kind: 'response', status: 204, retryAfterSeconds: null, body: '' };
const unavailable: HttpResult = { kind: 'response', status: 503, retryAfterSeconds: null, body: '' };
const gone: HttpResult = { kind: 'response', status: 404, retryAfterSeconds: null, body: '' };

async function resetDatabase() {
  await db.execute(sql`truncate table "user" cascade`);
  await db.execute(sql`truncate table resend_webhook_events`);
}

async function seed(
  options: {
    timeZone?: string;
    destinationType?: 'webhook' | 'email';
    kinds?: ('renewal_reminder' | 'monthly_overview')[];
  } = {},
) {
  await db.insert(schema.user).values({ id: 'user-1', name: 'Test', email: 'test@example.com', emailVerified: true });
  await db.insert(schema.collectionTable).values([
    { id: 'personal', userId: 'user-1', name: 'Personal' },
    { id: 'work', userId: 'user-1', name: 'Work' },
  ]);
  await db.insert(schema.notificationSettingsTable).values({
    userId: 'user-1',
    timeZone: options.timeZone ?? 'America/New_York',
    reminderLeadDays: 3,
    timingChangedAt: LONG_AGO,
  });
  await db.insert(schema.notificationDestinationTable).values(
    options.destinationType === 'email'
      ? { id: 'dest-1', userId: 'user-1', type: 'email', name: 'Email' }
      : {
          id: 'dest-1',
          userId: 'user-1',
          type: 'webhook',
          name: 'Server',
          webhookUrl: 'https://hooks.example.com/everysub',
          signingSecret: 'whsec_dGVzdC1zZWNyZXQtdGVzdC1zZWNyZXQtdGVzdC1zZWNyZQ==',
        },
  );
  for (const kind of options.kinds ?? ['renewal_reminder']) {
    await db.insert(schema.notificationRouteTable).values({
      userId: 'user-1',
      collectionId: 'personal',
      destinationId: 'dest-1',
      kind,
      createdAt: LONG_AGO,
    });
  }
}

async function addSubscription(values: Partial<typeof schema.subscriptionTable.$inferInsert> & { id: string }) {
  await db.insert(schema.subscriptionTable).values({
    userId: 'user-1',
    collectionId: 'personal',
    name: `Service ${values.id}`,
    iconRef: 'example.com',
    costAmount: 1000,
    costFrequency: 'monthly',
    nextInvoiceDate: '2026-10-07',
    remindersEligibleAt: LONG_AGO,
    ...values,
  });
}

/** Records invoices, schedules, and delivers, as the scheduled job does. */
async function runJob(at: string) {
  const now = new Date(at);
  await recordDueInvoices({ now });
  await scheduleDueNotifications({ now });

  return deliverDueNotifications({ clock: () => now });
}

async function getEvents() {
  return db.select().from(schema.notificationEventTable).orderBy(schema.notificationEventTable.createdAt);
}

async function getDestination() {
  const [destination] = await db
    .select()
    .from(schema.notificationDestinationTable)
    .where(eq(schema.notificationDestinationTable.id, 'dest-1'));

  return destination;
}

function sentBodies() {
  return postToWebhook.mock.calls.map(([input]) => JSON.parse(input.body));
}

describe.skipIf(!isLocalDatabase)('notification delivery (database)', () => {
  beforeEach(async () => {
    postToWebhook.mockReset();
    postToWebhook.mockResolvedValue(ok);
    sendNotificationEmail.mockReset();
    getEmailAvailability.mockReset();
    getEmailAvailability.mockResolvedValue({ available: true });
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await db.$client.end();
  });

  describe('renewal reminders', () => {
    it('sends one grouped reminder at 9 a.m. local and never repeats it', async () => {
      await seed();
      await addSubscription({ id: 'a', name: 'Alpha', costAmount: 1500 });
      await addSubscription({ id: 'b', name: 'Beta', costAmount: 700 });

      // Before 9 a.m., yesterday's send is the one due, and it has nothing.
      expect(await runJob('2026-10-04T12:55:00Z')).toMatchObject({ attempted: 1, skipped: 1 });
      expect(postToWebhook).not.toHaveBeenCalled();
      expect(await runJob('2026-10-04T13:05:00Z')).toMatchObject({ attempted: 1, succeeded: 1 });

      const [payload] = sentBodies();

      expect(payload).toMatchObject({
        type: 'renewal_reminder',
        schedule: { localDate: '2026-10-04', timeZone: 'America/New_York' },
        data: { itemCount: 2, totalExpectedAmountCents: 2200 },
      });
      expect(postToWebhook.mock.calls[0][0].headers['webhook-id']).toBe(payload.id);

      // Reruns the same day and the next day don't resend the reminded occurrences.
      expect(await runJob('2026-10-04T13:10:00Z')).toMatchObject({ attempted: 0 });
      expect(await runJob('2026-10-05T13:05:00Z')).toMatchObject({ attempted: 1, skipped: 1 });
      expect(postToWebhook).toHaveBeenCalledTimes(1);
    });

    it('lets only one of two concurrent runs send an event', async () => {
      await seed();
      await addSubscription({ id: 'a' });
      postToWebhook.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return ok;
      });

      const now = new Date('2026-10-04T13:05:00Z');
      await scheduleDueNotifications({ now });
      await scheduleDueNotifications({ now });
      await Promise.all([deliverDueNotifications({ clock: () => now }), deliverDueNotifications({ clock: () => now })]);

      expect(await getEvents()).toHaveLength(1);
      expect(postToWebhook).toHaveBeenCalledTimes(1);
    });

    it('retries a temporary failure with the same event ID', async () => {
      await seed();
      await addSubscription({ id: 'a' });
      postToWebhook.mockResolvedValueOnce(unavailable);

      expect(await runJob('2026-10-04T13:05:00Z')).toMatchObject({ retrying: 1 });

      const [retrying] = await getEvents();

      expect(retrying).toMatchObject({ status: 'retrying', attemptCount: 1 });
      expect((await getDestination()).lastFailureMessage).toContain('503');

      // Not before the retry is due.
      expect(await runJob('2026-10-04T13:06:00Z')).toMatchObject({ attempted: 0 });
      expect(await runJob('2026-10-04T13:20:00Z')).toMatchObject({ succeeded: 1 });

      const [first, second] = postToWebhook.mock.calls.map(([input]) => input.headers['webhook-id']);

      expect(first).toBe(second);
      expect((await getEvents())[0]).toMatchObject({ status: 'succeeded', attemptCount: 2 });
      expect(await getDestination()).toMatchObject({ consecutiveFailedEvents: 0, pausedAt: null });
    });

    it('cancels a pending retry when nothing eligible remains', async () => {
      await seed();
      await addSubscription({ id: 'a' });
      postToWebhook.mockResolvedValueOnce(unavailable);
      await runJob('2026-10-04T13:05:00Z');

      await db.transaction((tx) => applyInclusion(tx, { userId: 'user-1', subscriptionIds: ['a'], included: false }));

      expect(await runJob('2026-10-04T13:30:00Z')).toMatchObject({ cancelled: 1 });
      expect(postToWebhook).toHaveBeenCalledTimes(1);
      expect(await db.select().from(schema.notificationReminderClaimTable)).toEqual([]);
    });

    it('drops a removed route’s details from a pending retry', async () => {
      await seed();
      await db.insert(schema.notificationRouteTable).values({
        userId: 'user-1',
        collectionId: 'work',
        destinationId: 'dest-1',
        kind: 'renewal_reminder',
        createdAt: LONG_AGO,
      });
      await addSubscription({ id: 'a', name: 'Personal Thing' });
      await addSubscription({ id: 'w', name: 'Work Thing', collectionId: 'work' });
      postToWebhook.mockResolvedValueOnce(unavailable);
      await runJob('2026-10-04T13:05:00Z');

      await db.delete(schema.notificationRouteTable).where(and(eq(schema.notificationRouteTable.collectionId, 'work')));
      await runJob('2026-10-04T13:30:00Z');

      const retried = postToWebhook.mock.calls[1][0].body;

      expect(retried).toContain('Personal Thing');
      expect(retried).not.toContain('Work Thing');
    });

    it('pauses a destination that permanently rejects a request', async () => {
      await seed();
      await addSubscription({ id: 'a' });
      postToWebhook.mockResolvedValue(gone);

      expect(await runJob('2026-10-04T13:05:00Z')).toMatchObject({ failed: 1 });
      expect(await getDestination()).toMatchObject({ pauseReason: 'rejected' });

      // A paused destination gets nothing new.
      await addSubscription({ id: 'b', nextInvoiceDate: '2026-10-08' });
      expect(await runJob('2026-10-05T13:05:00Z')).toMatchObject({ attempted: 0 });
    });

    it('pauses a destination after a third event exhausts its retries', async () => {
      await seed();
      await addSubscription({ id: 'a' });
      await db
        .update(schema.notificationDestinationTable)
        .set({ consecutiveFailedEvents: 2 })
        .where(eq(schema.notificationDestinationTable.id, 'dest-1'));
      postToWebhook.mockResolvedValue(unavailable);

      for (const at of ['13:05', '13:20', '13:40', '14:10', '15:00']) {
        await runJob(`2026-10-04T${at}:00Z`);
      }

      expect(postToWebhook).toHaveBeenCalledTimes(5);
      expect((await getEvents())[0]).toMatchObject({ status: 'failed', attemptCount: 5 });
      expect(await getDestination()).toMatchObject({ consecutiveFailedEvents: 3, pauseReason: 'failing' });
    });

    it('counts every exhausted event when two workers fail at once', async () => {
      await seed({ kinds: ['renewal_reminder', 'monthly_overview'] });
      await addSubscription({ id: 'a', nextInvoiceDate: '2026-10-04' });
      await db
        .update(schema.notificationDestinationTable)
        .set({ consecutiveFailedEvents: 1 })
        .where(eq(schema.notificationDestinationTable.id, 'dest-1'));
      postToWebhook.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return unavailable;
      });

      const now = new Date('2026-10-01T13:05:00Z');
      await scheduleDueNotifications({ now });
      // Both events are on their last attempt.
      await db.update(schema.notificationEventTable).set({ attemptCount: 4 });
      await Promise.all([
        deliverDueNotifications({ clock: () => now, limit: 1 }),
        deliverDueNotifications({ clock: () => now, limit: 1 }),
      ]);

      expect(postToWebhook).toHaveBeenCalledTimes(2);
      expect((await getEvents()).map((event) => event.status)).toEqual(['failed', 'failed']);
      expect(await getDestination()).toMatchObject({ consecutiveFailedEvents: 3, pauseReason: 'failing' });
    });
  });

  describe('monthly overview', () => {
    it('sends recorded and projected items for routed collections only', async () => {
      await seed({ kinds: ['monthly_overview'] });
      await addSubscription({ id: 'a', name: 'Monthly Thing', nextInvoiceDate: '2026-10-01' });
      await addSubscription({
        id: 'excluded',
        name: 'Excluded Thing',
        nextInvoiceDate: '2026-10-15',
        notificationsIncluded: false,
      });
      await db.insert(schema.subscriptionInvoiceTable).values([
        {
          id: 'inv-sep',
          userId: 'user-1',
          subscriptionId: 'a',
          collectionId: 'personal',
          name: 'Monthly Thing',
          iconRef: 'example.com',
          category: 'Streaming',
          amount: 1000,
          invoiceDate: '2026-09-01',
        },
        {
          id: 'inv-deleted',
          userId: 'user-1',
          subscriptionId: null,
          collectionId: 'personal',
          name: 'Deleted Thing',
          iconRef: 'example.com',
          category: 'Streaming',
          amount: 500,
          invoiceDate: '2026-09-20',
        },
        {
          id: 'inv-deleted-excluded',
          userId: 'user-1',
          subscriptionId: null,
          collectionId: 'personal',
          name: 'Deleted Excluded',
          iconRef: 'example.com',
          category: 'Streaming',
          amount: 500,
          invoiceDate: '2026-09-21',
          notificationsIncluded: false,
        },
        {
          id: 'inv-work',
          userId: 'user-1',
          subscriptionId: null,
          collectionId: 'work',
          name: 'Work History',
          iconRef: 'example.com',
          category: 'Tools',
          amount: 900,
          invoiceDate: '2026-09-05',
        },
      ]);

      expect(await runJob('2026-10-01T13:05:00Z')).toMatchObject({ succeeded: 1 });

      const [payload] = sentBodies();
      const previous = payload.data.previousMonth.collections.flatMap(
        (group: { items: { name: string }[] }) => group.items,
      );
      const current = payload.data.newMonth.collections.flatMap(
        (group: { items: { name: string; source: string }[] }) => group.items,
      );

      expect(previous.map((item: { name: string }) => item.name)).toEqual(['Monthly Thing', 'Deleted Thing']);
      // October 1 was recorded by this run before the overview was built.
      expect(current.map((item: { name: string; source: string }) => [item.name, item.source])).toEqual([
        ['Monthly Thing', 'recorded'],
      ]);
      expect(JSON.stringify(payload)).not.toMatch(/Excluded Thing|Deleted Excluded|Work History/);

      // One overview per month.
      expect(await runJob('2026-10-02T13:05:00Z')).toMatchObject({ attempted: 0 });
    });

    it('catches up a missed overview through day 7 only', async () => {
      await seed({ kinds: ['monthly_overview'] });
      await addSubscription({ id: 'a', nextInvoiceDate: '2026-10-20' });

      expect(await runJob('2026-10-08T13:05:00Z')).toMatchObject({ attempted: 0 });
      expect(await runJob('2026-10-07T23:00:00Z')).toMatchObject({ succeeded: 1 });
      expect(sentBodies()[0].schedule.localDate).toBe('2026-10-01');
    });

    it('doesn’t replay this month’s overview for a route turned on after it was scheduled', async () => {
      await seed({ kinds: [] });
      await addSubscription({ id: 'a', nextInvoiceDate: '2026-10-20' });
      await db.insert(schema.notificationRouteTable).values({
        userId: 'user-1',
        collectionId: 'personal',
        destinationId: 'dest-1',
        kind: 'monthly_overview',
        createdAt: new Date('2026-10-02T15:00:00Z'),
      });

      expect(await runJob('2026-10-02T15:05:00Z')).toMatchObject({ attempted: 0 });
      expect(await getEvents()).toEqual([]);
    });
  });

  describe('email', () => {
    it('tracks Resend acceptance, delivery, and permanent rejection', async () => {
      await seed({ destinationType: 'email' });
      await addSubscription({ id: 'a' });
      sendNotificationEmail.mockResolvedValue({ outcome: 'succeeded', providerMessageId: 'email_123' });

      expect(await runJob('2026-10-04T13:05:00Z')).toMatchObject({ succeeded: 1 });
      expect(sendNotificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          idempotencyKey: expect.stringMatching(/^everysub\/evt_\w+\/[0-9a-f]{32}$/),
        }),
      );
      expect((await getEvents())[0]).toMatchObject({ providerMessageId: 'email_123', emailStatus: 'accepted' });

      expect(await handleResendEvent('msg_1', { type: 'email.delivered', data: { email_id: 'email_123' } })).toBe(
        'updated',
      );
      expect(await handleResendEvent('msg_1', { type: 'email.delivered', data: { email_id: 'email_123' } })).toBe(
        'duplicate',
      );
      // A late "sent" event can't move a delivered email backward.
      expect(await handleResendEvent('msg_2', { type: 'email.sent', data: { email_id: 'email_123' } })).toBe('ignored');
      expect((await getEvents())[0].emailStatus).toBe('delivered');

      await handleResendEvent('msg_3', {
        type: 'email.bounced',
        data: { email_id: 'email_123', bounce: { type: 'Permanent' } },
      });

      expect(await getDestination()).toMatchObject({ pauseReason: 'recipient_rejected' });
    });

    it('retries, rather than cancels, when Resend can’t be reached to check the domain', async () => {
      await seed({ destinationType: 'email' });
      await addSubscription({ id: 'a' });
      sendNotificationEmail.mockResolvedValue({ outcome: 'succeeded', providerMessageId: 'email_456' });
      // The scheduler's check succeeds; delivery's check can't reach Resend.
      getEmailAvailability
        .mockResolvedValueOnce({ available: true })
        .mockResolvedValueOnce({ available: false, reason: 'check_failed', message: 'Try again later.' });

      expect(await runJob('2026-10-04T13:05:00Z')).toMatchObject({ retrying: 1 });
      expect(sendNotificationEmail).not.toHaveBeenCalled();
      expect(await getDestination()).toMatchObject({ lastFailureAt: null, consecutiveFailedEvents: 0 });

      expect(await runJob('2026-10-04T13:20:00Z')).toMatchObject({ succeeded: 1 });
    });

    it('asks Resend to redeliver an event that arrives before its email is saved', async () => {
      await seed({ destinationType: 'email' });
      await addSubscription({ id: 'a' });
      const now = new Date('2026-10-04T13:06:00Z');
      const bounce = {
        type: 'email.bounced',
        created_at: '2026-10-04T13:05:30Z',
        data: { email_id: 'email_789', bounce: { type: 'Permanent' }, tags: { notification: 'renewal_reminder' } },
      };

      expect(await handleResendEvent('msg_early', bounce, now)).toBe('redeliver');
      expect(await db.select().from(schema.resendWebhookEventTable)).toEqual([]);

      sendNotificationEmail.mockResolvedValue({ outcome: 'succeeded', providerMessageId: 'email_789' });
      await runJob('2026-10-04T13:05:00Z');

      expect(await handleResendEvent('msg_early', bounce, now)).toBe('updated');
      expect(await getDestination()).toMatchObject({ pauseReason: 'recipient_rejected' });
    });

    it('doesn’t ask for redelivery of test emails or stale events', async () => {
      await seed({ destinationType: 'email' });
      const now = new Date('2026-10-04T13:06:00Z');
      const delivered = (tags: Record<string, string>, createdAt: string) => ({
        type: 'email.delivered',
        created_at: createdAt,
        data: { email_id: 'email_unknown', tags },
      });

      expect(
        await handleResendEvent('msg_test', delivered({ notification: 'test' }, '2026-10-04T13:05:30Z'), now),
      ).toBe('ignored');
      expect(
        await handleResendEvent(
          'msg_old',
          delivered({ notification: 'renewal_reminder' }, '2026-10-04T11:00:00Z'),
          now,
        ),
      ).toBe('ignored');
    });

    it('holds email while the account address awaits verification', async () => {
      await seed({ destinationType: 'email' });
      await addSubscription({ id: 'a' });
      await db.update(schema.user).set({ emailVerified: false }).where(eq(schema.user.id, 'user-1'));

      expect(await runJob('2026-10-04T13:05:00Z')).toMatchObject({ attempted: 0 });
      expect(sendNotificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('settings and routes', () => {
    it('records a timing change only when the time zone or lead time changes', async () => {
      await seed();
      const timingChangedAt = async () => (await db.select().from(schema.notificationSettingsTable))[0].timingChangedAt;

      await server.saveMySchedule({ userId: 'user-1', timeZone: 'America/New_York', reminderLeadDays: 3 });
      expect(await timingChangedAt()).toEqual(LONG_AGO);

      await server.saveMySchedule({ userId: 'user-1', timeZone: 'America/New_York', reminderLeadDays: 5 });
      expect((await timingChangedAt()).getTime()).toBeGreaterThan(LONG_AGO.getTime());
    });

    it('requires the inclusion review for a collection’s first route to a destination', async () => {
      await seed({ kinds: [] });
      await addSubscription({ id: 'a' });
      await addSubscription({ id: 'b' });
      const route = { userId: 'user-1', collectionId: 'personal', destinationId: 'dest-1', enabled: true } as const;

      await expect(server.setMyRoute({ ...route, kind: 'renewal_reminder' })).rejects.toThrow(
        /Review which subscriptions/,
      );

      await server.setMyRoute({
        ...route,
        kind: 'renewal_reminder',
        reviewedInclusion: [
          { subscriptionId: 'a', included: true },
          { subscriptionId: 'b', included: false },
        ],
      });

      const subscriptions = await db
        .select({ id: schema.subscriptionTable.id, included: schema.subscriptionTable.notificationsIncluded })
        .from(schema.subscriptionTable)
        .orderBy(schema.subscriptionTable.id);

      expect(subscriptions).toEqual([
        { id: 'a', included: true },
        { id: 'b', included: false },
      ]);

      // The pair was reviewed, so the second kind doesn't need it again.
      await server.setMyRoute({ ...route, kind: 'monthly_overview' });
      expect(await db.select().from(schema.notificationRouteTable)).toHaveLength(2);
    });

    it('keeps every rotated-out secret signing for a grace period, even after two rotations', async () => {
      await seed();
      const original = (await getDestination()).signingSecret;
      const rotate = () => server.rotateMySigningSecret({ userId: 'user-1', destinationId: 'dest-1' });
      const first = await rotate();
      const second = await rotate();
      const after = await getDestination();

      expect(after.signingSecret).toBe(second.signingSecret);
      expect(after.retiredSigningSecrets.map((entry) => entry.secret)).toEqual([original, first.signingSecret]);
      expect((second.previousSecretExpiresAt?.getTime() ?? 0) - Date.now()).toBeGreaterThan(23 * 60 * 60 * 1000);

      // A receiver still holding the original secret keeps verifying.
      await addSubscription({ id: 'a' });
      await runJob('2026-10-04T13:05:00Z');
      const signatures = postToWebhook.mock.calls[0][0].headers['webhook-signature'].split(' ');

      expect(signatures).toHaveLength(3);
    });

    it('keeps every secret from concurrent rotations', async () => {
      await seed();
      const original = (await getDestination()).signingSecret;
      const rotate = () => server.rotateMySigningSecret({ userId: 'user-1', destinationId: 'dest-1' });
      const results = await Promise.all(Array.from({ length: 4 }, rotate));
      const after = await getDestination();
      const signing = [after.signingSecret, ...after.retiredSigningSecrets.map((entry) => entry.secret)];

      expect(signing).toHaveLength(5);
      expect(signing).toEqual(expect.arrayContaining([original, ...results.map((result) => result.signingSecret)]));
    });

    it('sends tests with sample data only, at most once every few seconds', async () => {
      await seed();
      await addSubscription({ id: 'a', name: 'Real Private Service' });

      expect(
        await server.sendMyTestNotification({ userId: 'user-1', destinationId: 'dest-1', kind: 'renewal_reminder' }),
      ).toMatchObject({ ok: true });

      const [payload] = sentBodies();

      expect(payload.test).toBe(true);
      expect(JSON.stringify(payload)).not.toContain('Real Private Service');
      await expect(
        server.sendMyTestNotification({ userId: 'user-1', destinationId: 'dest-1', kind: 'monthly_overview' }),
      ).rejects.toThrow(/Wait a few seconds/);
      // Tests don't change delivery health.
      expect(await getDestination()).toMatchObject({ lastSuccessAt: null, lastFailureAt: null });
    });

    it('refuses webhook URLs on private networks', async () => {
      await seed();

      for (const url of ['https://10.0.0.5/hook', 'https://localhost/hook', 'http://hooks.example.com/hook']) {
        await expect(
          server.createMyWebhookDestination({ userId: 'user-1', type: 'webhook', name: 'Bad', url }),
        ).rejects.toThrow();
      }
    });

    it('removes every route when a destination is deleted', async () => {
      await seed({ kinds: ['renewal_reminder', 'monthly_overview'] });
      await addSubscription({ id: 'a' });
      postToWebhook.mockResolvedValueOnce(unavailable);
      await runJob('2026-10-04T13:05:00Z');

      await server.deleteMyDestination({ userId: 'user-1', destinationId: 'dest-1' });

      expect(await db.select().from(schema.notificationRouteTable)).toEqual([]);
      expect(await getEvents()).toEqual([]);
    });

    it('never touches another user’s destination', async () => {
      await seed();
      await db.insert(schema.user).values({ id: 'user-2', name: 'Other', email: 'other@example.com' });

      await expect(server.deleteMyDestination({ userId: 'user-2', destinationId: 'dest-1' })).rejects.toThrow(
        'Destination not found',
      );
      await expect(
        server.setMyDestinationPaused({ userId: 'user-2', destinationId: 'dest-1', paused: true }),
      ).rejects.toThrow('Destination not found');
      expect(await getDestination()).toMatchObject({ pausedAt: null });
    });
  });

  describe('privacy history and invoices', () => {
    it('keeps a deleted subscription’s final inclusion on its invoices', async () => {
      await seed();
      await addSubscription({ id: 'a', nextInvoiceDate: '2026-09-01' });
      await recordDueInvoices({ now: new Date('2026-09-02T12:00:00Z') });
      await db.transaction((tx) => applyInclusion(tx, { userId: 'user-1', subscriptionIds: ['a'], included: false }));
      await db.delete(schema.subscriptionTable).where(eq(schema.subscriptionTable.id, 'a'));

      expect(await db.select().from(schema.subscriptionInvoiceTable)).toEqual([
        expect.objectContaining({ subscriptionId: null, invoiceDate: '2026-09-01', notificationsIncluded: false }),
      ]);
    });

    it('records invoices on each user’s local date', async () => {
      await seed({ timeZone: 'Pacific/Kiritimati' });
      await addSubscription({ id: 'a', nextInvoiceDate: '2026-10-05' });

      // 10:30 UTC on October 4 is already October 5 in Kiritimati (UTC+14).
      expect(await recordDueInvoices({ now: new Date('2026-10-04T10:30:00Z') })).toEqual({
        subscriptionsProcessed: 1,
        invoicesCreated: 1,
      });

      await db.update(schema.notificationSettingsTable).set({ timeZone: 'America/New_York' });
      await addSubscription({ id: 'b', nextInvoiceDate: '2026-10-05' });

      expect(await recordDueInvoices({ now: new Date('2026-10-04T10:30:00Z') })).toMatchObject({ invoicesCreated: 0 });
    });
  });
});
