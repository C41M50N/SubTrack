import { z } from 'zod';
import createJSONExport from '@/features/import-export/actions/create-json-export';
import importData, {
  ImportDataProps,
} from '@/features/import-export/actions/import-data';
import dayjs from '@/lib/dayjs';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const dataRouter = createTRPCRouter({
  createJSONExport: protectedProcedure.mutation(async ({ ctx }) => {
    return await createJSONExport(ctx);
  }),

  getExportData: protectedProcedure
    .input(
      z.object({
        format: z.enum(['csv', 'json']),
        collectionId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const allCategories =
        (
          await ctx.db.categoryList.findMany({
            where: { user_id: ctx.session.user.id },
          })
        ).at(0)?.categories ?? [];

      const subscriptions = await ctx.db.subscription.findMany({
        where: input.collectionId
          ? {
              user_id: ctx.session.user.id,
              collection_id: input.collectionId,
            }
          : { user_id: ctx.session.user.id },
        include: {
          collection: {
            select: {
              title: true,
            },
          },
        },
      });

      // Clean up subscriptions data so it can be exported
      const nullValue = input.format === 'json' ? null : '';
      const subs = subscriptions
        .map(({ id, user_id, collection_id, ...rest }) => rest)
        .map(({ collection, next_invoice, last_invoice, ...rest }) => ({
          ...rest,
          collection: collection.title,
          next_invoice: dayjs(next_invoice).format('MM/DD/YYYY'),
          last_invoice:
            last_invoice !== null
              ? dayjs(last_invoice).format('MM/DD/YYYY')
              : nullValue,
        }));

      return {
        categories: allCategories,
        subscriptions: subs,
      };
    }),

  importData: protectedProcedure
    .input(ImportDataProps)
    .mutation(async ({ ctx, input }) => {
      return await importData(ctx, input);
    }),
});
