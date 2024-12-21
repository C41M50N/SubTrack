import type { AuthenticatedContext } from "@/server/api/trpc";
import { z } from "zod";

export const UpdateUserInfoSchema = z.object({
  name: z.string(),
})

export default async function updateUserInfo(
  ctx: AuthenticatedContext, input: z.infer<typeof UpdateUserInfoSchema>
) {
  await ctx.db.user.update({
    where: { id: ctx.session.user.id },
    data: {
      name: input.name
    }
  })
}
