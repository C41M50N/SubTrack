import { createServerFn } from '@tanstack/react-start';

import { requireAuthMiddleware } from '@/features/auth/middleware';
import { setUpAccountInputSchema } from '@/features/onboarding/schema';
import { getMyOnboarding, markMyReminderInvitationShown, setUpMyAccount } from '@/features/onboarding/server';
import { withUserFacingErrors } from '@/lib/errors';

export const getOnboarding = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context: { auth } }) => getMyOnboarding(auth.userId));

export const setUpAccount = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(setUpAccountInputSchema)
  .handler(async ({ context: { auth }, data }) =>
    withUserFacingErrors('Couldn’t set up your account. Try again.', () =>
      setUpMyAccount({ userId: auth.userId, timeZone: data.timeZone }),
    ),
  );

export const markReminderInvitationShown = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context: { auth } }) => markMyReminderInvitationShown(auth.userId));
