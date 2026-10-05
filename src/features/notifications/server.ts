import { lookup } from 'node:dns/promises';

import { and, asc, desc, eq, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';

import { getManageNotificationsUrl } from '@/features/notifications/delivery';
import { applyInclusion } from '@/features/notifications/inclusion';
import { getEmailAvailability, type EmailAvailability } from '@/features/notifications/resend';
import { buildTestOverview, buildTestReminder } from '@/features/notifications/samples';
import { generateSigningSecret, getUnexpiredSecrets, retireSecret } from '@/features/notifications/signing';
import { normalizeTimeZone, toLocalDateKey } from '@/features/notifications/time';
import { prepareDelivery } from '@/features/notifications/transports';
import { checkWebhookUrl, isPublicAddress, maskWebhookUrl } from '@/features/notifications/url-safety';
import { getUserTimeZone } from '@/features/notifications/user-time-zone';
import { generateId } from '@/lib/data-utils';
import { db, type DbTransaction } from '@/lib/db';
import { user } from '@/lib/db/auth-schema';
import { collectionTable } from '@/lib/db/collection-schema';
import {
  DEFAULT_REMINDER_LEAD_DAYS,
  notificationDestinationTable,
  notificationEventTable,
  notificationRouteTable,
  notificationSettingsTable,
  type EmailDeliveryStatus,
  type NotificationDestinationType,
  type NotificationKind,
  type NotificationPauseReason,
} from '@/lib/db/notification-schema';
import { subscriptionTable } from '@/lib/db/subscription-schema';
import { UserFacingError } from '@/lib/errors';

/** Minimum time between test sends to one destination. */
const TEST_COOLDOWN_MS = 10_000;

type Destination = typeof notificationDestinationTable.$inferSelect;

export type DestinationHealth =
  /** Active, but nothing has been sent yet. */
  | 'ready'
  /** The latest delivery succeeded. */
  | 'healthy'
  /** The latest delivery failed and will be retried. */
  | 'failing'
  /** Paused by the user. */
  | 'paused'
  /** Paused by delivery, or blocked until something is fixed. */
  | 'needs_attention';

export type DestinationRouteSummary = {
  collectionId: string;
  collectionName: string;
  kind: NotificationKind;
};

export type DestinationSummary = {
  id: string;
  type: NotificationDestinationType;
  name: string;
  /** A masked URL or the account email. Never the full webhook URL. */
  target: string;
  paused: boolean;
  pauseReason: NotificationPauseReason | null;
  health: DestinationHealth;
  /** A sentence describing the health, for the settings list and alerts. */
  healthMessage: string;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  lastFailureMessage: string | null;
  /** The latest email's provider status, which separates "accepted" from "delivered". */
  latestEmail: { status: EmailDeliveryStatus; at: Date } | null;
  previousSecretExpiresAt: Date | null;
  routes: DestinationRouteSummary[];
  createdAt: Date;
};

const PAUSE_MESSAGES: Record<NotificationPauseReason, string> = {
  user: 'Paused. Nothing is sent until you resume it.',
  rejected: 'Paused because the destination rejected a notification.',
  failing: 'Paused after repeated delivery failures.',
  recipient_rejected: 'Paused because your email address rejected a notification.',
};

function describeHealth(
  destination: Destination,
  context: { emailVerified: boolean; email: EmailAvailability | null },
): { health: DestinationHealth; message: string } {
  if (destination.pausedAt && destination.pauseReason) {
    return {
      health: destination.pauseReason === 'user' ? 'paused' : 'needs_attention',
      message: destination.pauseMessage ?? PAUSE_MESSAGES[destination.pauseReason],
    };
  }

  if (destination.type === 'email') {
    if (context.email && !context.email.available) {
      return { health: 'needs_attention', message: context.email.message };
    }

    if (!context.emailVerified) {
      return {
        health: 'needs_attention',
        message: 'Waiting for your account email to be verified. Email resumes once it is.',
      };
    }
  }

  const failedLast =
    destination.lastFailureAt && (!destination.lastSuccessAt || destination.lastFailureAt > destination.lastSuccessAt);

  if (failedLast) {
    return { health: 'failing', message: destination.lastFailureMessage ?? 'The latest delivery failed.' };
  }

  if (destination.lastSuccessAt) {
    return { health: 'healthy', message: 'Delivering normally.' };
  }

  return { health: 'ready', message: 'Nothing has been sent yet.' };
}

/** When the last still-valid retired signing secret stops signing requests. */
function latestExpiry(retired: Destination['retiredSigningSecrets']): Date | null {
  const expiries = getUnexpiredSecrets(retired, new Date()).map((entry) => Date.parse(entry.expiresAt));

  return expiries.length > 0 ? new Date(Math.max(...expiries)) : null;
}

function toTarget(destination: Destination, accountEmail: string): string {
  return destination.type === 'email' ? accountEmail : maskWebhookUrl(destination.webhookUrl ?? '');
}

async function listRouteSummaries(userId: string): Promise<Map<string, DestinationRouteSummary[]>> {
  const rows = await db
    .select({
      destinationId: notificationRouteTable.destinationId,
      collectionId: notificationRouteTable.collectionId,
      collectionName: collectionTable.name,
      kind: notificationRouteTable.kind,
    })
    .from(notificationRouteTable)
    .innerJoin(collectionTable, eq(collectionTable.id, notificationRouteTable.collectionId))
    .where(eq(notificationRouteTable.userId, userId))
    .orderBy(asc(collectionTable.name), asc(notificationRouteTable.kind));

  const byDestination = new Map<string, DestinationRouteSummary[]>();

  for (const row of rows) {
    const routes = byDestination.get(row.destinationId) ?? [];
    routes.push({ collectionId: row.collectionId, collectionName: row.collectionName, kind: row.kind });
    byDestination.set(row.destinationId, routes);
  }

  return byDestination;
}

async function getLatestEmailStatus(destinationId: string) {
  const [latest] = await db
    .select({ status: notificationEventTable.emailStatus, at: notificationEventTable.emailStatusAt })
    .from(notificationEventTable)
    .where(and(eq(notificationEventTable.destinationId, destinationId), isNotNull(notificationEventTable.emailStatus)))
    .orderBy(desc(notificationEventTable.succeededAt))
    .limit(1);

  return latest?.status && latest.at ? { status: latest.status, at: latest.at } : null;
}

async function getAccount(userId: string) {
  const [account] = await db
    .select({ email: user.email, emailVerified: user.emailVerified })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!account) {
    throw new Error('User not found');
  }

  return account;
}

async function getSchedule(userId: string) {
  const [settings] = await db
    .select({
      timeZone: notificationSettingsTable.timeZone,
      reminderLeadDays: notificationSettingsTable.reminderLeadDays,
    })
    .from(notificationSettingsTable)
    .where(eq(notificationSettingsTable.userId, userId))
    .limit(1);

  return settings ?? null;
}

export async function listMyDestinations(userId: string) {
  const [account, destinations, routes] = await Promise.all([
    getAccount(userId),
    db
      .select()
      .from(notificationDestinationTable)
      .where(eq(notificationDestinationTable.userId, userId))
      .orderBy(asc(notificationDestinationTable.createdAt)),
    listRouteSummaries(userId),
  ]);

  const hasEmail = destinations.some((destination) => destination.type === 'email');
  const email = hasEmail ? await getEmailAvailability() : null;

  return Promise.all(
    destinations.map(async (destination): Promise<DestinationSummary> => {
      const destinationRoutes = routes.get(destination.id) ?? [];
      const { health, message } = describeHealth(destination, {
        emailVerified: account.emailVerified,
        email,
      });

      return {
        id: destination.id,
        type: destination.type,
        name: destination.name,
        target: toTarget(destination, account.email),
        paused: destination.pausedAt !== null,
        pauseReason: destination.pauseReason,
        health,
        healthMessage: message,
        lastSuccessAt: destination.lastSuccessAt,
        lastFailureAt: destination.lastFailureAt,
        lastFailureMessage: destination.lastFailureMessage,
        latestEmail: destination.type === 'email' ? await getLatestEmailStatus(destination.id) : null,
        previousSecretExpiresAt: latestExpiry(destination.retiredSigningSecrets),
        routes: destinationRoutes,
        createdAt: destination.createdAt,
      };
    }),
  );
}

/** Everything the account notification settings page shows. */
export async function getMyNotificationSettings(userId: string) {
  const [schedule, account, destinations, email] = await Promise.all([
    getSchedule(userId),
    getAccount(userId),
    listMyDestinations(userId),
    getEmailAvailability(),
  ]);

  return { schedule, account, email, destinations };
}

/** Saves the user's time zone and reminder lead time. */
export async function saveMySchedule(input: { userId: string; timeZone: string; reminderLeadDays: number }) {
  const timeZone = normalizeTimeZone(input.timeZone);

  if (!timeZone) {
    throw new UserFacingError('Choose a valid time zone');
  }

  // Changing either setting moves future reminder times. Recording when it
  // changed keeps an already-past reminder time from being caught up.
  const [settings] = await db
    .insert(notificationSettingsTable)
    .values({ userId: input.userId, timeZone, reminderLeadDays: input.reminderLeadDays })
    .onConflictDoUpdate({
      target: notificationSettingsTable.userId,
      set: {
        timeZone,
        reminderLeadDays: input.reminderLeadDays,
        timingChangedAt: sql`case when ${notificationSettingsTable.timeZone} is distinct from excluded.time_zone or ${notificationSettingsTable.reminderLeadDays} is distinct from excluded.reminder_lead_days then now() else ${notificationSettingsTable.timingChangedAt} end`,
      },
    })
    .returning({
      timeZone: notificationSettingsTable.timeZone,
      reminderLeadDays: notificationSettingsTable.reminderLeadDays,
    });

  return settings;
}

/**
 * Validates a webhook URL and confirms its host resolves only to public
 * addresses. Delivery checks again on every request.
 */
async function validateWebhookUrl(raw: string, type: 'webhook' | 'discord'): Promise<string> {
  const check = checkWebhookUrl(raw, type);

  if (!check.ok) {
    throw new UserFacingError(check.message);
  }

  const hostname = check.url.hostname.replace(/^\[|\]$/g, '');

  if (type === 'webhook' && !isPublicAddress(hostname)) {
    let addresses: { address: string }[];

    try {
      addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new UserFacingError('Couldn’t find that host. Check the URL and try again.');
    }

    if (addresses.length === 0 || !addresses.every((entry) => isPublicAddress(entry.address))) {
      throw new UserFacingError('URL must point to a public address');
    }
  }

  return check.url.toString();
}

async function getOwnedDestination(userId: string, destinationId: string, executor: typeof db | DbTransaction = db) {
  const [destination] = await executor
    .select()
    .from(notificationDestinationTable)
    .where(and(eq(notificationDestinationTable.userId, userId), eq(notificationDestinationTable.id, destinationId)))
    .limit(1);

  if (!destination) {
    throw new Error('Destination not found');
  }

  return destination;
}

export async function createMyWebhookDestination(input: {
  userId: string;
  type: 'webhook' | 'discord';
  name: string;
  url: string;
}) {
  const webhookUrl = await validateWebhookUrl(input.url, input.type);
  const signingSecret = input.type === 'webhook' ? generateSigningSecret() : null;

  const [destination] = await db
    .insert(notificationDestinationTable)
    .values({ userId: input.userId, type: input.type, name: input.name, webhookUrl, signingSecret })
    .returning({ id: notificationDestinationTable.id });

  // The signing secret is shown once, right after creation or rotation.
  return { destinationId: destination.id, signingSecret };
}

export async function createMyEmailDestination(input: { userId: string; name: string }) {
  const email = await getEmailAvailability();

  if (!email.available) {
    throw new UserFacingError(email.message);
  }

  const [destination] = await db
    .insert(notificationDestinationTable)
    .values({ userId: input.userId, type: 'email', name: input.name })
    .onConflictDoNothing()
    .returning({ id: notificationDestinationTable.id });

  if (!destination) {
    throw new UserFacingError('Your account email is already a destination');
  }

  return { destinationId: destination.id };
}

export async function updateMyDestination(input: {
  userId: string;
  destinationId: string;
  name: string;
  url?: string;
}) {
  const destination = await getOwnedDestination(input.userId, input.destinationId);
  const webhookUrl =
    input.url && destination.type !== 'email' ? await validateWebhookUrl(input.url, destination.type) : undefined;

  await db
    .update(notificationDestinationTable)
    .set({ name: input.name, webhookUrl })
    .where(eq(notificationDestinationTable.id, destination.id));
}

export async function setMyDestinationPaused(input: { userId: string; destinationId: string; paused: boolean }) {
  const destination = await getOwnedDestination(input.userId, input.destinationId);

  // Resuming starts with a clean failure count. Missed notifications are not
  // replayed; only those still within their catch-up window may go out.
  await db
    .update(notificationDestinationTable)
    .set(
      input.paused
        ? { pausedAt: destination.pausedAt ?? new Date(), pauseReason: destination.pauseReason ?? 'user' }
        : { pausedAt: null, pauseReason: null, pauseMessage: null, consecutiveFailedEvents: 0 },
    )
    .where(eq(notificationDestinationTable.id, destination.id));
}

/**
 * Replaces a generic webhook's signing secret. Every rotated-out secret keeps
 * signing requests for a grace period, so an active receiver doesn't break
 * while it's updated, even if the secret is rotated again in the meantime.
 */
export async function rotateMySigningSecret(input: { userId: string; destinationId: string }) {
  // Rotations are serialized so each one retires the secret it replaces.
  return db.transaction(async (tx) => {
    const [destination] = await tx
      .select()
      .from(notificationDestinationTable)
      .where(
        and(
          eq(notificationDestinationTable.userId, input.userId),
          eq(notificationDestinationTable.id, input.destinationId),
        ),
      )
      .limit(1)
      .for('update');

    if (!destination) {
      throw new Error('Destination not found');
    }

    if (destination.type !== 'webhook' || !destination.signingSecret) {
      throw new UserFacingError('Only webhook destinations have a signing secret');
    }

    const signingSecret = generateSigningSecret();
    const retiredSigningSecrets = retireSecret(
      destination.retiredSigningSecrets,
      destination.signingSecret,
      new Date(),
    );

    await tx
      .update(notificationDestinationTable)
      .set({ signingSecret, retiredSigningSecrets })
      .where(eq(notificationDestinationTable.id, destination.id));

    return { signingSecret, previousSecretExpiresAt: latestExpiry(retiredSigningSecrets) };
  });
}

/** Deletes a destination and every route to it. Pending sends to it are dropped with it. */
export async function deleteMyDestination(input: { userId: string; destinationId: string }) {
  const [deleted] = await db
    .delete(notificationDestinationTable)
    .where(
      and(
        eq(notificationDestinationTable.userId, input.userId),
        eq(notificationDestinationTable.id, input.destinationId),
      ),
    )
    .returning({ id: notificationDestinationTable.id });

  if (!deleted) {
    throw new Error('Destination not found');
  }
}

/** Sends clearly labeled sample data. Doesn't change the destination's delivery health. */
export async function sendMyTestNotification(input: { userId: string; destinationId: string; kind: NotificationKind }) {
  const now = new Date();
  const [destination] = await db
    .update(notificationDestinationTable)
    .set({ lastTestAt: now })
    .where(
      and(
        eq(notificationDestinationTable.userId, input.userId),
        eq(notificationDestinationTable.id, input.destinationId),
        or(
          isNull(notificationDestinationTable.lastTestAt),
          lt(notificationDestinationTable.lastTestAt, new Date(now.getTime() - TEST_COOLDOWN_MS)),
        ),
      ),
    )
    .returning();

  if (!destination) {
    await getOwnedDestination(input.userId, input.destinationId);
    throw new UserFacingError('Wait a few seconds before sending another test');
  }

  let recipientEmail: string | null = null;

  if (destination.type === 'email') {
    const [account, email] = await Promise.all([getAccount(input.userId), getEmailAvailability()]);

    if (!email.available) {
      throw new UserFacingError(email.message);
    }

    if (!account.emailVerified) {
      throw new UserFacingError('Your account email needs to be verified first');
    }

    recipientEmail = account.email;
  }

  const [timeZone, schedule] = await Promise.all([getUserTimeZone(input.userId), getSchedule(input.userId)]);
  const sample = {
    eventId: `test_${generateId()}`,
    timeZone,
    localDate: toLocalDateKey(now, timeZone),
  };
  const content =
    input.kind === 'renewal_reminder'
      ? buildTestReminder({ ...sample, leadDays: schedule?.reminderLeadDays ?? DEFAULT_REMINDER_LEAD_DAYS })
      : buildTestOverview(sample);

  const prepared = await prepareDelivery({
    destination,
    content,
    recipientEmail,
    manageUrl: getManageNotificationsUrl(),
    now: () => new Date(),
  });
  const result = await prepared.send();

  if (result.outcome === 'succeeded') {
    return {
      ok: true,
      message:
        destination.type === 'email'
          ? 'Resend accepted the test email. It should arrive shortly.'
          : 'The test was delivered.',
    };
  }

  return { ok: false, message: result.message };
}

export async function setMySubscriptionsInclusion(input: {
  userId: string;
  subscriptionIds: string[];
  included: boolean;
}) {
  return db.transaction(async (tx) => {
    const owned = await tx
      .select({ id: subscriptionTable.id })
      .from(subscriptionTable)
      .where(and(eq(subscriptionTable.userId, input.userId), inArray(subscriptionTable.id, input.subscriptionIds)))
      .for('update');

    if (owned.length !== input.subscriptionIds.length) {
      throw new UserFacingError('Subscriptions changed. Refresh and try again.');
    }

    await applyInclusion(tx, input);
  });
}

/** What a collection's notification settings show: routes per destination and subscription inclusion. */
export async function getMyCollectionNotifications(userId: string, collectionId: string) {
  const [collection] = await db
    .select({ id: collectionTable.id, name: collectionTable.name })
    .from(collectionTable)
    .where(and(eq(collectionTable.userId, userId), eq(collectionTable.id, collectionId)))
    .limit(1);

  if (!collection) {
    throw new Error('Collection not found');
  }

  const [schedule, destinations, subscriptions] = await Promise.all([
    getSchedule(userId),
    listMyDestinations(userId),
    db
      .select({
        id: subscriptionTable.id,
        name: subscriptionTable.name,
        iconRef: subscriptionTable.iconRef,
        status: subscriptionTable.status,
        notificationsIncluded: subscriptionTable.notificationsIncluded,
        costAmount: subscriptionTable.costAmount,
        costFrequency: subscriptionTable.costFrequency,
      })
      .from(subscriptionTable)
      .where(and(eq(subscriptionTable.userId, userId), eq(subscriptionTable.collectionId, collectionId)))
      .orderBy(asc(subscriptionTable.status), asc(subscriptionTable.name)),
  ]);

  const email = destinations.some((destination) => destination.type === 'email') ? await getEmailAvailability() : null;

  return {
    collection,
    schedule,
    emailAvailable: email?.available ?? false,
    destinations: destinations.map((destination) => ({
      ...destination,
      collectionRoutes: {
        renewal_reminder: destination.routes.some(
          (route) => route.collectionId === collectionId && route.kind === 'renewal_reminder',
        ),
        monthly_overview: destination.routes.some(
          (route) => route.collectionId === collectionId && route.kind === 'monthly_overview',
        ),
      },
    })),
    subscriptions,
  };
}

/**
 * Turns one collection's route to a destination on or off. The first route
 * between a collection and a destination requires the inclusion review, whose
 * choices are saved in the same transaction as the route.
 */
export async function setMyRoute(input: {
  userId: string;
  collectionId: string;
  destinationId: string;
  kind: NotificationKind;
  enabled: boolean;
  reviewedInclusion?: { subscriptionId: string; included: boolean }[];
}) {
  if (!input.enabled) {
    await db
      .delete(notificationRouteTable)
      .where(
        and(
          eq(notificationRouteTable.userId, input.userId),
          eq(notificationRouteTable.collectionId, input.collectionId),
          eq(notificationRouteTable.destinationId, input.destinationId),
          eq(notificationRouteTable.kind, input.kind),
        ),
      );

    return;
  }

  const schedule = await getSchedule(input.userId);

  if (!schedule) {
    throw new UserFacingError('Choose your notification time zone first');
  }

  const destination = await getOwnedDestination(input.userId, input.destinationId);

  if (destination.type === 'email') {
    const email = await getEmailAvailability();

    if (!email.available) {
      throw new UserFacingError(email.message);
    }
  }

  await db.transaction(async (tx) => {
    const [collection] = await tx
      .select({ id: collectionTable.id })
      .from(collectionTable)
      .where(and(eq(collectionTable.userId, input.userId), eq(collectionTable.id, input.collectionId)))
      .limit(1)
      .for('update');

    if (!collection) {
      throw new Error('Collection not found');
    }

    const existing = await tx
      .select({ id: notificationRouteTable.id })
      .from(notificationRouteTable)
      .where(
        and(
          eq(notificationRouteTable.collectionId, input.collectionId),
          eq(notificationRouteTable.destinationId, input.destinationId),
        ),
      )
      .limit(1);

    if (existing.length === 0 && !input.reviewedInclusion) {
      throw new UserFacingError('Review which subscriptions are included before turning this on');
    }

    for (const included of [true, false]) {
      await applyInclusion(tx, {
        userId: input.userId,
        collectionId: input.collectionId,
        included,
        subscriptionIds: (input.reviewedInclusion ?? [])
          .filter((change) => change.included === included)
          .map((change) => change.subscriptionId),
      });
    }

    await tx
      .insert(notificationRouteTable)
      .values({
        userId: input.userId,
        collectionId: input.collectionId,
        destinationId: input.destinationId,
        kind: input.kind,
      })
      .onConflictDoNothing();
  });
}
