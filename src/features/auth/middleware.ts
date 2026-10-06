import { createMiddleware } from '@tanstack/react-start';

import { getRequestSession } from './session';

type Session = Awaited<ReturnType<typeof getRequestSession>>;
type AuthSession = NonNullable<Session>;

export type PublicAuthContext = {
  auth: {
    session: Session;
    user: AuthSession['user'] | null;
  };
};

export type ProtectedAuthContext = {
  auth: {
    session: AuthSession;
    user: AuthSession['user'];
    userId: AuthSession['user']['id'];
  };
};

export const authMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const session = await getRequestSession();

  return next({
    context: {
      auth: {
        session,
        user: session?.user ?? null,
      } satisfies PublicAuthContext['auth'],
    },
  });
});

export const requireAuthMiddleware = createMiddleware({ type: 'function' })
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    if (!context.auth.session || !context.auth.user) {
      throw new Error('Unauthorized');
    }

    return next({
      context: {
        auth: {
          session: context.auth.session,
          user: context.auth.user,
          userId: context.auth.user.id,
        } satisfies ProtectedAuthContext['auth'],
      },
    });
  });
