import { and, eq, gt, sql } from 'drizzle-orm';

import { listMyCategories } from '@/features/categories/server';
import { getMyCollection } from '@/features/collections/server';
import type { ImportCandidate } from '@/features/imports/candidates';
import {
  classifyFileSelection,
  detectSmartImportMediaType,
  SMART_IMPORT_MAX_PAGES,
  TOO_MANY_PAGES_MESSAGE,
} from '@/features/imports/files';
import { countPages, UnreadableFileError } from '@/features/imports/pages';
import {
  getFailedRunUsage,
  isSmartImportConfigured,
  runSmartImportAgent,
  SMART_IMPORT_MODEL_ID,
  SMART_IMPORT_TIMEOUT_MS,
  type SmartImportAgentFile,
} from '@/features/imports/smart-import/agent';
import { candidatesFromAgentOutput } from '@/features/imports/smart-import/candidates';
import {
  evaluateSmartImportUsage,
  getSmartImportUsageMessage,
  hasRunInProgress,
  RUN_IN_PROGRESS_MESSAGE,
  type SmartImportUsage,
  USAGE_WINDOW_MS,
} from '@/features/imports/usage';
import { toDateKey } from '@/features/invoices/domain';
import { db, type DbTransaction } from '@/lib/db';
import { aiUsageTable, type AiUsageStatus, type SmartImportUsageMetadata } from '@/lib/db/ai-usage-schema';
import { UserFacingError } from '@/lib/errors';

export type SmartImportStatus = {
  configured: boolean;
  /** Null when smart import isn't configured. */
  usage: SmartImportUsage | null;
};

export type SmartImportResult = {
  candidates: ImportCandidate[];
};

export type SmartImportResponse =
  | { status: 'succeeded'; candidates: ImportCandidate[] }
  | { status: 'failed'; message: string };

const SMART_IMPORT_FAILED_MESSAGE = 'Smart import failed. Try again.';

// Usage limits are skipped in development so the agent can be iterated on.
function areUsageLimitsEnforced(): boolean {
  return !import.meta.env.DEV;
}

async function listRecentSmartImportRuns(executor: typeof db | DbTransaction, userId: string, now: Date) {
  return executor
    .select({ status: aiUsageTable.status, createdAt: aiUsageTable.createdAt })
    .from(aiUsageTable)
    .where(
      and(
        eq(aiUsageTable.userId, userId),
        eq(aiUsageTable.feature, 'smart_import'),
        gt(aiUsageTable.createdAt, new Date(now.getTime() - USAGE_WINDOW_MS)),
      ),
    );
}

export async function getMySmartImportStatus(userId: string): Promise<SmartImportStatus> {
  if (!isSmartImportConfigured()) {
    return { configured: false, usage: null };
  }

  if (!areUsageLimitsEnforced()) {
    return { configured: true, usage: { status: 'available', successesRemaining: null } };
  }

  const now = new Date();
  const runs = await listRecentSmartImportRuns(db, userId, now);

  return { configured: true, usage: evaluateSmartImportUsage(runs, now) };
}

/**
 * Checks the usage limits and records a `started` run in one transaction. A
 * per-user advisory lock serializes the check, and allowing one run at a time
 * keeps parallel requests from all passing the success limit.
 */
async function startSmartImportRun(userId: string, metadata: SmartImportUsageMetadata): Promise<string> {
  return db.transaction(async (tx) => {
    if (areUsageLimitsEnforced()) {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`ai_usage:smart_import:${userId}`}))`);

      const now = new Date();
      const runs = await listRecentSmartImportRuns(tx, userId, now);
      const usage = evaluateSmartImportUsage(runs, now);

      if (usage.status !== 'available') {
        throw new UserFacingError(getSmartImportUsageMessage(usage, now) ?? SMART_IMPORT_FAILED_MESSAGE);
      }

      if (hasRunInProgress(runs, now)) {
        throw new UserFacingError(RUN_IN_PROGRESS_MESSAGE);
      }
    }

    const [run] = await tx
      .insert(aiUsageTable)
      .values({ userId, feature: 'smart_import', metadata })
      .returning({ id: aiUsageTable.id });

    if (!run) {
      throw new Error('Failed to record smart import run');
    }

    return run.id;
  });
}

async function finishSmartImportRun(
  runId: string,
  status: Exclude<AiUsageStatus, 'started'>,
  metadata: SmartImportUsageMetadata,
) {
  await db.update(aiUsageTable).set({ status, completedAt: new Date(), metadata }).where(eq(aiUsageTable.id, runId));
}

async function readSmartImportFiles(files: File[]): Promise<{ files: SmartImportAgentFile[]; pageCount: number }> {
  const selection = classifyFileSelection(files);

  if (selection.path !== 'smart') {
    throw new UserFacingError(selection.path === 'invalid' ? selection.message : 'Upload PDFs or images.');
  }

  const agentFiles: SmartImportAgentFile[] = [];
  let pageCount = 0;

  for (const file of selection.files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mediaType = detectSmartImportMediaType(bytes);

    if (!mediaType) {
      throw new UserFacingError(`${file.name} isn’t a PDF, PNG, JPEG, or WebP file.`);
    }

    try {
      pageCount += await countPages({ name: file.name, mediaType, bytes });
    } catch (error) {
      if (error instanceof UnreadableFileError) {
        throw new UserFacingError(error.message);
      }

      throw error;
    }

    if (pageCount > SMART_IMPORT_MAX_PAGES) {
      throw new UserFacingError(TOO_MANY_PAGES_MESSAGE);
    }

    agentFiles.push({ mediaType, bytes });
  }

  return { files: agentFiles, pageCount };
}

function hasErrorNamed(error: unknown, name: string): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if (current.name === name) {
      return true;
    }
  }

  return false;
}

/** A short failure description for the usage row. Never includes agent output. */
function describeFailure(error: unknown): string {
  if (hasErrorNamed(error, 'TimeoutError')) {
    return `Timed out after ${SMART_IMPORT_TIMEOUT_MS / 1000}s`;
  }

  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
}

/**
 * Finds subscriptions in uploaded statements, receipts, or screenshots. Files
 * are held in memory for this request only. Nothing here logs file contents or
 * agent output.
 */
export async function runMySmartImport(input: {
  userId: string;
  collectionId: string;
  files: File[];
  abortSignal: AbortSignal;
}): Promise<SmartImportResult> {
  const collection = await getMyCollection(input.userId, input.collectionId);

  if (!collection) {
    throw new Error('Collection not found');
  }

  if (!isSmartImportConfigured()) {
    throw new UserFacingError('Smart import isn’t configured.');
  }

  // Files rejected here never reach the provider or count toward usage limits.
  const { files, pageCount } = await readSmartImportFiles(input.files);
  const categories = (await listMyCategories(input.userId, input.collectionId)).map((category) => category.name);

  const baseMetadata: SmartImportUsageMetadata = {
    modelId: SMART_IMPORT_MODEL_ID,
    fileCount: files.length,
    pageCount,
  };
  const runId = await startSmartImportRun(input.userId, baseMetadata);
  const startedAt = Date.now();
  const today = toDateKey(new Date());

  try {
    const { data, metadata } = await runSmartImportAgent({
      files,
      categories,
      today,
      abortSignal: input.abortSignal,
    });
    const candidates = candidatesFromAgentOutput(data, { today, categories });

    await finishSmartImportRun(runId, 'succeeded', {
      ...baseMetadata,
      inputTokens: metadata.inputTokens,
      outputTokens: metadata.outputTokens,
      costUsd: metadata.totalCostUsd,
      durationMs: metadata.responseTimeMs,
      itemCount: candidates.length,
    });

    return { candidates };
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    if (input.abortSignal.aborted) {
      await finishSmartImportRun(runId, 'cancelled', { ...baseMetadata, durationMs });
      throw new UserFacingError('Smart import was cancelled.');
    }

    console.log(`[LLM][smart-import] failed after ${(durationMs / 1000).toFixed(2)}s`);
    await finishSmartImportRun(runId, 'failed', {
      ...baseMetadata,
      ...getFailedRunUsage(error),
      durationMs,
      errorMessage: describeFailure(error),
    });

    throw new UserFacingError(
      hasErrorNamed(error, 'TimeoutError') ? 'Smart import took too long. Try again.' : SMART_IMPORT_FAILED_MESSAGE,
    );
  }
}
