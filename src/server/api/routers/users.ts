import { AccountDetailsSchema } from '@/features/users';
import deleteUser from '@/features/users/actions/delete-user';
import updateUserDetails from '@/features/users/actions/update-user-details';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const usersRouter = createTRPCRouter({
  updateAccountDetails: protectedProcedure
    .input(AccountDetailsSchema)
    .mutation(async ({ ctx, input }) => {
      return await updateUserDetails(ctx, input);
    }),

  getCurrentUser: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user;
  }),

  deleteUser: protectedProcedure.mutation(async ({ ctx }) => {
    return await deleteUser(ctx);
  }),
});
