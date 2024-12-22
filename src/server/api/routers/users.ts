import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import deleteUser from "@/features/users/actions/delete-user";
import updateUserDetails from "@/features/users/actions/update-user-details";
import { AccountDetailsSchema } from "@/features/users";

export const usersRouter = createTRPCRouter({
  updateAccountDetails: protectedProcedure
    .input(AccountDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      return await updateUserDetails(ctx, input)
    }),

  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.session.user;
    }),

  deleteUser: protectedProcedure
    .mutation(async ({ ctx }) => {
      return await deleteUser(ctx)
    }),
})