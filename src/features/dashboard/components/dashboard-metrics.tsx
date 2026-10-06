import { useState } from 'react';

import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { countCategories } from '@/features/dashboard/domain';
import type {
  ProjectedInvoice,
  RecordedInvoice,
} from '@/features/invoices/domain';
import {
  invoicesInRollingWindow,
  summarizeInvoices,
} from '@/features/invoices/domain';
import {
  formatCurrencyFromCents,
  sumEffectiveMonthlyCents,
  sumEffectiveYearlyCents,
} from '@/features/subscriptions/cost';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';
import { useCountUp } from '@/hooks/use-count-up';
import { cn } from '@/lib/utils';

const DUE_WINDOW_DAYS = 30;

const LABEL_CLASS =
  'text-xs font-semibold uppercase tracking-widest text-muted-foreground';

const VALUE_CLASS =
  'font-heading text-3xl font-semibold tracking-tight tabular-nums';

/** A figure with nothing behind it yet, in onboarding's preview. */
const PENDING_CARD_CLASS =
  'border border-dashed border-foreground/15 bg-transparent shadow-none ring-0';

const PENDING_VALUE_CLASS = 'text-muted-foreground/55';

type DashboardMetricsProps = {
  subscriptions: SubscriptionRecord[];
  projectedInvoices: ProjectedInvoice[];
  /** Recorded invoices already narrowed to the current calendar month. */
  recordedThisMonth: RecordedInvoice[];
  historyLoading: boolean;
  historyError: boolean;
  onRetryHistory: () => void;
  now: Date;
  /**
   * Onboarding's preview of the dashboard: figures with nothing behind them
   * yet look unfilled, amounts count up as subscriptions are added, and the
   * monthly cost shows what the last addition added to it.
   */
  preview?: boolean;
};

type MoneyProps = {
  cents: number;
  /** A value on its way to `cents` while counting up. */
  displayCents?: number;
  className?: string;
};

function Money({ cents, displayCents = cents, className }: MoneyProps) {
  return (
    <span
      className={className}
      aria-label={`${(cents / 100).toFixed(2)} US dollars`}
    >
      {formatCurrencyFromCents(displayCents)}
    </span>
  );
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * The four headline figures for a collection.
 *
 * Monthly cost is the smoothed average, so it answers "what does this cost
 * me?"; the two schedule cards answer "what actually leaves my account?" and
 * deliberately disagree with it when an annual plan renews.
 */
export function DashboardMetrics({
  subscriptions,
  projectedInvoices,
  recordedThisMonth,
  historyLoading,
  historyError,
  onRetryHistory,
  now,
  preview = false,
}: DashboardMetricsProps) {
  const monthlyCents = sumEffectiveMonthlyCents(subscriptions);
  const [previousMonthlyCents, setPreviousMonthlyCents] =
    useState(monthlyCents);
  const [monthlyIncreaseCents, setMonthlyIncreaseCents] = useState(0);

  if (monthlyCents !== previousMonthlyCents) {
    setPreviousMonthlyCents(monthlyCents);
    setMonthlyIncreaseCents(Math.max(0, monthlyCents - previousMonthlyCents));
  }

  const yearlyCents = sumEffectiveYearlyCents(subscriptions);
  const categoryCount = countCategories(subscriptions);
  const due = summarizeInvoices(
    invoicesInRollingWindow(projectedInvoices, now, DUE_WINDOW_DAYS),
  );
  const recorded = summarizeInvoices(recordedThisMonth);

  const displayedMonthlyCents = useCountUp(monthlyCents, preview);
  const displayedYearlyCents = useCountUp(yearlyCents, preview);
  const displayedCount = useCountUp(subscriptions.length, preview);
  const displayedDueCents = useCountUp(due.totalCents, preview);

  const hasSubscriptions = subscriptions.length > 0;
  const pending = {
    monthly: preview && !hasSubscriptions,
    count: preview && !hasSubscriptions,
    due: preview && due.count === 0,
    recorded:
      preview && !historyLoading && !historyError && recorded.count === 0,
  };

  return (
    // Named so the tiles glide from onboarding's preview into the dashboard.
    <div className="grid gap-4 [view-transition-name:dashboard-metrics] sm:grid-cols-2 xl:grid-cols-4">
      <Card size="sm" className={cn(pending.monthly && PENDING_CARD_CLASS)}>
        <CardHeader className="gap-0.5">
          <span className={LABEL_CLASS}>Monthly cost</span>
          <span className="flex items-center gap-2">
            <span
              className={cn(
                VALUE_CLASS,
                pending.monthly && PENDING_VALUE_CLASS,
              )}
            >
              <Money
                cents={monthlyCents}
                displayCents={displayedMonthlyCents}
              />
              <span
                className={cn(
                  'ml-0.5 text-base font-normal text-muted-foreground',
                  pending.monthly && PENDING_VALUE_CLASS,
                )}
              >
                /mo
              </span>
            </span>
            {preview && monthlyIncreaseCents > 0 ? (
              <span
                // Replays the entrance when another addition raises it again.
                key={subscriptions.length}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary tabular-nums motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-90 motion-safe:duration-300"
              >
                +{formatCurrencyFromCents(monthlyIncreaseCents)}
                <span className="sr-only"> just added</span>
              </span>
            ) : null}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatCurrencyFromCents(displayedYearlyCents)} per year
          </span>
        </CardHeader>
      </Card>

      <Card size="sm" className={cn(pending.count && PENDING_CARD_CLASS)}>
        <CardHeader className="gap-0.5">
          <span className={LABEL_CLASS}>Active subscriptions</span>
          <span
            className={cn(VALUE_CLASS, pending.count && PENDING_VALUE_CLASS)}
          >
            {displayedCount}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {categoryCount === 0
              ? 'No categories in use yet'
              : `Across ${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'}`}
          </span>
        </CardHeader>
      </Card>

      <Card size="sm" className={cn(pending.due && PENDING_CARD_CLASS)}>
        <CardHeader className="gap-0.5">
          <span className={LABEL_CLASS}>Due in {DUE_WINDOW_DAYS} days</span>
          <Money
            cents={due.totalCents}
            displayCents={displayedDueCents}
            className={cn(VALUE_CLASS, pending.due && PENDING_VALUE_CLASS)}
          />
          <span className="text-xs text-muted-foreground tabular-nums">
            {due.count === 0
              ? 'Nothing due'
              : `${pluralize(due.count, 'expected invoice')}`}
          </span>
        </CardHeader>
      </Card>

      <Card size="sm" className={cn(pending.recorded && PENDING_CARD_CLASS)}>
        <CardHeader className="gap-0.5">
          <span className={LABEL_CLASS}>Recorded this month</span>
          {historyLoading ? (
            <Skeleton className="my-1 h-9 w-32" />
          ) : historyError ? (
            <button
              type="button"
              className="w-fit text-left text-sm font-medium text-destructive underline underline-offset-4"
              onClick={onRetryHistory}
            >
              Retry history
            </button>
          ) : (
            <Money
              cents={recorded.totalCents}
              className={cn(
                VALUE_CLASS,
                pending.recorded && PENDING_VALUE_CLASS,
              )}
            />
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            {historyLoading
              ? 'Loading history'
              : historyError
                ? 'History unavailable'
                : pluralize(recorded.count, 'recorded invoice')}
          </span>
        </CardHeader>
      </Card>
    </div>
  );
}
