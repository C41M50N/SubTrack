import { index, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { generateId } from '@/lib/data-utils';
import { user } from '@/lib/db/auth-schema';

export const aiUsageFeatureEnum = pgEnum('ai_usage_feature', ['smart_import']);

export const aiUsageStatusEnum = pgEnum('ai_usage_status', ['started', 'succeeded', 'failed', 'cancelled']);

export type AiUsageFeature = (typeof aiUsageFeatureEnum.enumValues)[number];
export type AiUsageStatus = (typeof aiUsageStatusEnum.enumValues)[number];

export type SmartImportUsageMetadata = {
  modelId: string;
  fileCount: number;
  pageCount: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  durationMs?: number;
  itemCount?: number;
  errorMessage?: string;
};

type AiUsageMetadataByFeature = {
  smart_import: SmartImportUsageMetadata;
};

export type AiUsageMetadata = AiUsageMetadataByFeature[AiUsageFeature];

// One row per AI run. Rows are written before the run starts so a crash still
// leaves a `started` row that counts toward usage limits.
export const aiUsageTable = pgTable(
  'ai_usage',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    feature: aiUsageFeatureEnum('feature').notNull(),
    status: aiUsageStatusEnum('status').notNull().default('started'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    metadata: jsonb('metadata').$type<AiUsageMetadata>().notNull(),
  },
  (table) => [
    // Rolling-window usage limit lookups for this user and feature
    index('ai_usage_user_feature_created_at_idx').on(table.userId, table.feature, table.createdAt),
  ],
);
