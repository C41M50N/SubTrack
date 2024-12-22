import type { AuthenticatedContext } from "@/server/api/trpc";

export default async function deleteUser(
	ctx: AuthenticatedContext,
): Promise<void> {
	await ctx.db.user.delete({
		where: { id: ctx.session.user.id },
	});
}
