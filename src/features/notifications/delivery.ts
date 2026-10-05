import { and, asc, eq, inArray, lt, lte, or } from 'drizzle-orm';
import { ENV } from 'varlock/env';

import { buildEventContent, releaseReminderClaims } from '@/features/notifications/build';
import { isContentEmpty } from '@/features/notifications/content';
import {
  getDestinationHealthUpdate,
  MAX_DELIVERY_ATTEMPTS,
  resolveAttempt,
  type AttemptResolution,
  type SendResult,
} from '@/features/notifications/delivery-policy';
import { getEmailAvailability } from '@/features/notifications/resend';
import { prepareDelivery } from '@/features/notifications/transports';
import { generateId } from '@/lib/data-utils';
import { db } from '@/lib/db';
import { user } from '@/lib/db/auth-schema';
import {
  notificationAttemptTable,
  notificationDestinationTable,
  notificationEventTable,
  type NotificationEventStatus,
} from '@/lib/db/notification-schema';
import { describeErrorSafely } from '@/lib/errors';

/** How long a worker owns a claimed event before another run may take it over. */
const LEASE_MS = 2 * 60_000;

/** Caps one run's work so a backlog can't keep a job running indefinitely. */
const MAX_EVENTS_PER_RUN = 200;

type ClaimedEvent = typeof notificationEventTable.$inferSelect & { leaseToken: string };

export type DeliveryRunResult = {
  attempted: number;
  succeeded: number;
  retrying: number;
  failed: number;
  cancelled: number;
  skipped: number;
};

export function getManageNotificationsUrl(): string {
  return new URL('/settings/notifications', ENV.BETTER_AUTH_URL).toString();
}

/**
 * Claims the next event that is due, or whose previous worker's lease ran
 * out. SKIP LOCKED lets concurrent runs claim different events, and the
 * transaction ends before anything is sent.
 */
async function claimNextEvent(now: Date): Promise<ClaimedEvent | null> {
  return db.transaction(async (tx) => {
    const [candidate] = await tx
      .select({ id: notificationEventTable.id, attemptCount: notificationEventTable.attemptCount })
      .from(notificationEventTable)
      .where(
        or(
          and(
            inArray(notificationEventTable.status, ['pending', 'retrying']),
            lte(notificationEventTable.nextAttemptAt, now),
          ),
          and(eq(notificationEventTable.status, 'sending'), lt(notificationEventTable.leaseExpiresAt, now)),
        ),
      )
      .orderBy(asc(notificationEventTable.nextAttemptAt))
      .limit(1)
      .for('update', { skipLocked: true });

    if (!candidate) {
      return null;
    }

    const leaseToken = generateId();
    const [claimed] = await tx
      .update(notificationEventTable)
      .set({
        status: 'sending',
        leaseToken,
        leaseExpiresAt: new Date(now.getTime() + LEASE_MS),
        attemptCount: candidate.attemptCount + 1,
      })
      .where(eq(notificationEventTable.id, candidate.id))
      .returning();

    return { ...claimed, leaseToken };
  });
}

async function loadDestination(event: ClaimedEvent) {
  const [row] = await db
    .select({
      destination: notificationDestinationTable,
      email: user.email,
      emailVerified: user.emailVerified,
    })
    .from(notificationDestinationTable)
    .innerJoin(user, eq(user.id, notificationDestinationTable.userId))
    .where(
      and(
        eq(notificationDestinationTable.id, event.destinationId),
        eq(notificationDestinationTable.userId, event.userId),
      ),
    )
    .limit(1);

  return row ?? null;
}

/** Ends an attempt that never sent anything, such as one with no eligible content. */
async function closeWithoutSending(
  event: ClaimedEvent,
  status: Extract<NotificationEventStatus, 'cancelled' | 'skipped' | 'failed'>,
  reason: string,
  startedAt: Date,
  now: Date,
) {
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(notificationEventTable)
      .set({ status, lastError: reason, completedAt: now, leaseToken: null, leaseExpiresAt: null, nextAttemptAt: null })
      .where(and(eq(notificationEventTable.id, event.id), eq(notificationEventTable.leaseToken, event.leaseToken)))
      .returning({ id: notificationEventTable.id });

    if (updated.length === 0) {
      return;
    }

    await releaseReminderClaims(tx, event.id);
    await tx.insert(notificationAttemptTable).values({
      eventId: event.id,
      attemptNumber: event.attemptCount,
      outcome: 'cancelled',
      message: reason,
      startedAt,
      finishedAt: now,
    });
  });
}

async function recordOutcome(input: {
  event: ClaimedEvent;
  result: SendResult;
  resolution: AttemptResolution;
  requestKey: string;
  startedAt: Date;
  now: Date;
}) {
  const { event, result, resolution, now } = input;
  const succeeded = result.outcome === 'succeeded';
  const isFinal = resolution.status !== 'retrying';

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(notificationEventTable)
      .set({
        status: resolution.status,
        requestKey: input.requestKey,
        nextAttemptAt: resolution.status === 'retrying' ? resolution.nextAttemptAt : null,
        leaseToken: null,
        leaseExpiresAt: null,
        lastError: succeeded ? null : result.message,
        ...(succeeded
          ? {
              succeededAt: now,
              providerMessageId: result.providerMessageId ?? null,
              emailStatus: result.providerMessageId ? 'accepted' : null,
              emailStatusAt: result.providerMessageId ? now : null,
            }
          : {}),
        ...(isFinal ? { completedAt: now } : {}),
      })
      .where(and(eq(notificationEventTable.id, event.id), eq(notificationEventTable.leaseToken, event.leaseToken)))
      .returning({ id: notificationEventTable.id });

    // Another worker took over after this lease expired; its record wins.
    if (updated.length === 0) {
      return;
    }

    if (resolution.status === 'failed') {
      await releaseReminderClaims(tx, event.id);
    }

    // Read the count under a row lock: other workers may be recording
    // outcomes for the same destination at the same time.
    const [destination] = await tx
      .select({ consecutiveFailedEvents: notificationDestinationTable.consecutiveFailedEvents })
      .from(notificationDestinationTable)
      .where(eq(notificationDestinationTable.id, event.destinationId))
      .for('update');

    if (!destination) {
      return;
    }

    await tx
      .update(notificationDestinationTable)
      .set(
        getDestinationHealthUpdate({
          consecutiveFailedEvents: destination.consecutiveFailedEvents,
          resolution,
          result,
          now,
        }),
      )
      .where(eq(notificationDestinationTable.id, event.destinationId));

    await tx.insert(notificationAttemptTable).values({
      eventId: event.id,
      attemptNumber: event.attemptCount,
      outcome: result.outcome,
      statusCode: result.statusCode ?? null,
      message: succeeded ? null : result.message,
      requestKey: input.requestKey,
      startedAt: input.startedAt,
      finishedAt: now,
    });
  });
}

type AttemptStatus = keyof Omit<DeliveryRunResult, 'attempted'>;

async function attemptEvent(event: ClaimedEvent, clock: () => Date): Promise<AttemptStatus> {
  const startedAt = clock();

  if (event.attemptCount > MAX_DELIVERY_ATTEMPTS) {
    await closeWithoutSending(
      event,
      'failed',
      'Delivery stopped after the maximum number of attempts.',
      startedAt,
      clock(),
    );
    return 'failed';
  }

  const row = await loadDestination(event);

  if (!row) {
    return 'cancelled';
  }

  const { destination } = row;

  // A paused destination doesn't build up a backlog; resuming it starts fresh
  // under the usual catch-up rules.
  if (destination.pausedAt) {
    await closeWithoutSending(event, 'cancelled', 'The destination is paused.', startedAt, clock());
    return 'cancelled';
  }

  if (destination.type === 'email') {
    if (!row.emailVerified) {
      await closeWithoutSending(
        event,
        'cancelled',
        'The account email is waiting for verification.',
        startedAt,
        clock(),
      );
      return 'cancelled';
    }

    const availability = await getEmailAvailability();

    // A check that merely couldn't reach Resend says nothing about the
    // sending domain, so the attempt waits for a retry instead of ending.
    if (!availability.available && availability.reason === 'check_failed') {
      return deferAttempt(event, availability.message, clock());
    }

    if (!availability.available) {
      await closeWithoutSending(event, 'cancelled', availability.message, startedAt, clock());
      return 'cancelled';
    }
  }

  const build = await buildEventContent(event, clock());

  if (!build.content || isContentEmpty(build.content)) {
    // An event that never had anything to send is skipped; one that lost its
    // content between retries is cancelled.
    const status = event.attemptCount === 1 ? 'skipped' : 'cancelled';
    await closeWithoutSending(
      event,
      status,
      build.content ? 'Nothing eligible to send.' : build.reason,
      startedAt,
      clock(),
    );
    return status;
  }

  const prepared = await prepareDelivery({
    destination,
    content: build.content,
    recipientEmail: row.emailVerified ? row.email : null,
    manageUrl: getManageNotificationsUrl(),
    now: clock,
  });

  // No transaction is open while the request is in flight.
  const result = await prepared.send();
  const now = clock();
  const resolution = resolveAttempt({ attemptNumber: event.attemptCount, result, now });

  await recordOutcome({
    event,
    result,
    resolution,
    requestKey: prepared.requestKey,
    startedAt,
    now,
  });

  return resolution.status;
}

/** Sends every notification event that is due, one claimed event at a time. */
export async function deliverDueNotifications(
  options: { clock?: () => Date; limit?: number } = {},
): Promise<DeliveryRunResult> {
  const clock = options.clock ?? (() => new Date());
  const result: DeliveryRunResult = { attempted: 0, succeeded: 0, retrying: 0, failed: 0, cancelled: 0, skipped: 0 };

  for (let index = 0; index < (options.limit ?? MAX_EVENTS_PER_RUN); index += 1) {
    const event = await claimNextEvent(clock());

    if (!event) {
      break;
    }

    result.attempted += 1;

    try {
      result[await attemptEvent(event, clock)] += 1;
    } catch (error) {
      // An unexpected error (such as a database hiccup while building) leaves
      // the event to be retried. Log the type only: messages could carry data.
      console.error(`Notification event ${event.id} attempt failed: ${describeErrorSafely(error)}`);
      result[await deferAttempt(event, 'EverySub hit an internal error preparing this notification.', clock())] += 1;
    }
  }

  return result;
}

/**
 * Puts an attempt back on the retry schedule without counting it against the
 * destination, for failures on EverySub's side rather than the destination's.
 */
async function deferAttempt(event: ClaimedEvent, message: string, now: Date): Promise<AttemptStatus> {
  const resolution = resolveAttempt({
    attemptNumber: event.attemptCount,
    result: { outcome: 'temporary_failure', message },
    now,
  });

  await db
    .update(notificationEventTable)
    .set({
      status: resolution.status === 'retrying' ? 'retrying' : 'failed',
      nextAttemptAt: resolution.status === 'retrying' ? resolution.nextAttemptAt : null,
      leaseToken: null,
      leaseExpiresAt: null,
      lastError: message,
      ...(resolution.status === 'retrying' ? {} : { completedAt: now }),
    })
    .where(and(eq(notificationEventTable.id, event.id), eq(notificationEventTable.leaseToken, event.leaseToken)));

  if (resolution.status !== 'retrying') {
    await releaseReminderClaims(db, event.id);
  }

  return resolution.status === 'retrying' ? 'retrying' : 'failed';
}
