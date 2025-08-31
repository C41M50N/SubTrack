import type { z } from 'zod';
import type { AuthenticatedContext } from '@/server/api/trpc';
import type { AccountDetailsSchema } from '..';

export default async function updateUserDetails(
  ctx: AuthenticatedContext,
  input: z.infer<typeof AccountDetailsSchema>
) {
  await ctx.db.user.update({
    where: { id: ctx.session.user.id },
    data: {
      name: input.name,
    },
  });
}
