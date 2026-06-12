import type { AuthenticatedContext } from '@/server/api/trpc';

export default function getCurrentUser(ctx: AuthenticatedContext) {
  return ctx.session.user;
}
