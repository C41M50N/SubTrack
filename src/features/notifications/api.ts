import { createServerFn } from '@tanstack/react-start';

import { requireAuthMiddleware } from '@/features/auth/middleware';
import {
  collectionNotificationsInputSchema,
  createEmailDestinationInputSchema,
  createWebhookDestinationInputSchema,
  destinationIdInputSchema,
  saveNotificationScheduleInputSchema,
  sendTestNotificationInputSchema,
  setDestinationPausedInputSchema,
  setRouteInputSchema,
  setSubscriptionsInclusionInputSchema,
  updateDestinationInputSchema,
} from '@/features/notifications/schema';
import {
  createMyEmailDestination,
  createMyWebhookDestination,
  deleteMyDestination,
  getMyCollectionNotifications,
  getMyNotificationSettings,
  listMyDestinations,
  rotateMySigningSecret,
  saveMySchedule,
  sendMyTestNotification,
  setMyDestinationPaused,
  setMyRoute,
  setMySubscriptionsInclusion,
  updateMyDestination,
} from '@/features/notifications/server';
import { withUserFacingErrors } from '@/lib/errors';

// Notification inputs include webhook URLs and secrets, so unexpected errors
// are logged by type only.
const SAFE_LOGGING = { logDetails: false } as const;

export const getNotificationSettings = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context: { auth } }) => getMyNotificationSettings(auth.userId));

export const listNotificationDestinations = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context: { auth } }) => listMyDestinations(auth.userId));

export const saveNotificationSchedule = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(saveNotificationScheduleInputSchema)
  .handler(async ({ context: { auth }, data }) =>
    withUserFacingErrors(
      'Failed to save your schedule. Try again.',
      () => saveMySchedule({ userId: auth.userId, ...data }),
      SAFE_LOGGING,
    ),
  );

export const createWebhookDestination = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(createWebhookDestinationInputSchema)
  .handler(async ({ context: { auth }, data }) =>
    withUserFacingErrors(
      'Failed to add the destination. Try again.',
      () => createMyWebhookDestination({ userId: auth.userId, ...data }),
      SAFE_LOGGING,
    ),
  );

export const createEmailDestination = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(createEmailDestinationInputSchema)
  .handler(async ({ context: { auth }, data }) =>
    withUserFacingErrors(
      'Failed to add email. Try again.',
      () => createMyEmailDestination({ userId: auth.userId, ...data }),
      SAFE_LOGGING,
    ),
  );

export const updateDestination = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(updateDestinationInputSchema)
  .handler(async ({ context: { auth }, data }) =>
    withUserFacingErrors(
      'Failed to save the destination. Try again.',
      () => updateMyDestination({ userId: auth.userId, ...data }),
      SAFE_LOGGING,
    ),
  );

export const setDestinationPaused = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(setDestinationPausedInputSchema)
  .handler(async ({ context: { auth }, data }) =>
    withUserFacingErrors(
      'Failed to update the destination. Try again.',
      () => setMyDestinationPaused({ userId: auth.userId, ...data }),
      SAFE_LOGGING,
    ),
  );

export const rotateSigningSecret = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(destinationIdInputSchema)
  .handler(async ({ context: { auth }, data }) =>
    withUserFacingErrors(
      'Failed to rotate the secret. Try again.',
      () => rotateMySigningSecret({ userId: auth.userId, ...data }),
      SAFE_LOGGING,
    ),
  );

export const deleteDestination = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(destinationIdInputSchema)
  .handler(async ({ context: { auth }, data }) =>
    withUserFacingErrors(
      'Failed to delete the destination. Try again.',
      () => deleteMyDestination({ userId: auth.userId, ...data }),
      SAFE_LOGGING,
    ),
  );

export const sendTestNotification = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(sendTestNotificationInputSchema)
  .handler(async ({ context: { auth }, data }) =>
    withUserFacingErrors(
      'Failed to send the test. Try again.',
      () => sendMyTestNotification({ userId: auth.userId, ...data }),
      SAFE_LOGGING,
    ),
  );

export const getCollectionNotifications = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .validator(collectionNotificationsInputSchema)
  .handler(async ({ context: { auth }, data }) => getMyCollectionNotifications(auth.userId, data.collectionId));

export const setRoute = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(setRouteInputSchema)
  .handler(async ({ context: { auth }, data }) =>
    withUserFacingErrors(
      'Failed to update the route. Try again.',
      () => setMyRoute({ userId: auth.userId, ...data }),
      SAFE_LOGGING,
    ),
  );

export const setSubscriptionsInclusion = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(setSubscriptionsInclusionInputSchema)
  .handler(async ({ context: { auth }, data }) =>
    withUserFacingErrors(
      'Failed to update notifications. Try again.',
      () => setMySubscriptionsInclusion({ userId: auth.userId, ...data }),
      SAFE_LOGGING,
    ),
  );
