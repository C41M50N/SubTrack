import type { AiUsageStatus } from '@/lib/db/ai-usage-schema';

export const USAGE_WINDOW_MS = 24 * 60 * 60 * 1000;
export const SMART_IMPORT_SUCCESS_LIMIT = 5;
export const SMART_IMPORT_ATTEMPT_LIMIT = 15;

/** When 2 or fewer successful runs remain, the upload step says how many. */
const REMAINING_NOTICE_THRESHOLD = 2;

/**
 * How long a `started` run can still be in progress: the 5-minute run timeout
 * plus a margin. Older `started` runs were left behind by a crash.
 */
export const RUN_IN_PROGRESS_MS = 6 * 60 * 1000;

export const RUN_IN_PROGRESS_MESSAGE = 'Another smart import is still running. Try again when it finishes.';

export type UsageRun = { status: AiUsageStatus; createdAt: Date };

export type SmartImportUsage =
  | { status: 'available'; successesRemaining: number | null }
  | { status: 'success_limit' | 'attempt_limit'; availableAt: Date };

/**
 * When a limit frees up: the moment the oldest run that keeps the count at the
 * limit leaves the rolling window. Null while under the limit.
 */
function getLimitResetAt(runs: UsageRun[], limit: number): Date | null {
  if (runs.length < limit) {
    return null;
  }

  const sorted = [...runs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const blocking = sorted[sorted.length - limit];

  return blocking ? new Date(blocking.createdAt.getTime() + USAGE_WINDOW_MS) : null;
}

/**
 * Checks smart import runs against both rolling 24-hour limits: 5 successful
 * runs and 15 attempts of any status. A run left `started` by a crash counts
 * as an attempt.
 */
export function evaluateSmartImportUsage(runs: UsageRun[], now: Date): SmartImportUsage {
  const windowStart = now.getTime() - USAGE_WINDOW_MS;
  const attempts = runs.filter((run) => run.createdAt.getTime() > windowStart);
  const successes = attempts.filter((run) => run.status === 'succeeded');

  const attemptResetAt = getLimitResetAt(attempts, SMART_IMPORT_ATTEMPT_LIMIT);
  const successResetAt = getLimitResetAt(successes, SMART_IMPORT_SUCCESS_LIMIT);

  // Both limits must clear before another run, so report the later one.
  if (attemptResetAt && (!successResetAt || attemptResetAt >= successResetAt)) {
    return { status: 'attempt_limit', availableAt: attemptResetAt };
  }

  if (successResetAt) {
    return { status: 'success_limit', availableAt: successResetAt };
  }

  return { status: 'available', successesRemaining: SMART_IMPORT_SUCCESS_LIMIT - successes.length };
}

/**
 * Whether a run may still be in progress. Runs go one at a time so parallel
 * requests can't all pass the success limit before any of them finishes.
 */
export function hasRunInProgress(runs: UsageRun[], now: Date): boolean {
  return runs.some((run) => run.status === 'started' && now.getTime() - run.createdAt.getTime() < RUN_IN_PROGRESS_MS);
}

export function formatWaitTime(availableAt: Date, now: Date): string {
  const minutes = Math.max(1, Math.ceil((availableAt.getTime() - now.getTime()) / 60_000));

  return minutes < 60 ? `${minutes}m` : `${Math.ceil(minutes / 60)}h`;
}

/** The upload step's usage message, or null when there's nothing to say. */
export function getSmartImportUsageMessage(usage: SmartImportUsage, now: Date): string | null {
  switch (usage.status) {
    case 'available': {
      const remaining = usage.successesRemaining;

      if (remaining === null || remaining > REMAINING_NOTICE_THRESHOLD) {
        return null;
      }

      return `${remaining} smart ${remaining === 1 ? 'import' : 'imports'} left today`;
    }
    case 'success_limit':
      return `Smart import is available again in ${formatWaitTime(usage.availableAt, now)}`;
    case 'attempt_limit':
      return `Too many attempts. Try again in ${formatWaitTime(usage.availableAt, now)}.`;
  }
}
