import createJSONExport from '@/features/import-export/actions/create-json-export';
import getExportData, {
  GetExportDataInput,
} from '@/features/import-export/actions/get-export-data';
import importData, {
  ImportDataProps,
} from '@/features/import-export/actions/import-data';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const dataRouter = createTRPCRouter({
  createJSONExport: protectedProcedure.mutation(async ({ ctx }) => {
    return await createJSONExport(ctx);
  }),

  getExportData: protectedProcedure
    .input(GetExportDataInput)
    .mutation(async ({ ctx, input }) => {
      return await getExportData(ctx, input);
    }),

  importData: protectedProcedure
    .input(ImportDataProps)
    .mutation(async ({ ctx, input }) => {
      return await importData(ctx, input);
    }),
});
