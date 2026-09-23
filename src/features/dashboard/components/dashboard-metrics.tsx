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

const DUE_WINDOW_DAYS = 30;

const LABEL_CLASS =
  'text-xs font-semibold uppercase tracking-widest text-muted-foreground';

const VALUE_CLASS =
  'font-heading text-3xl font-semibold tracking-tight tabular-nums';

type DashboardMetricsProps = {
  subscriptions: SubscriptionRecord[];
  projectedInvoices: ProjectedInvoice[];
  /** Recorded invoices already narrowed to the current calendar month. */
  recordedThisMonth: RecordedInvoice[];
  historyLoading: boolean;
  historyError: boolean;
  onRetryHistory: () => void;
  now: Date;
};

function Money({ cents, className }: { cents: number; className?: string }) {
  return (
    <span
      className={className}
      aria-label={`${(cents / 100).toFixed(2)} US dollars`}
    >
      {formatCurrencyFromCents(cents)}
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
}: DashboardMetricsProps) {
  const monthlyCents = sumEffectiveMonthlyCents(subscriptions);
  const yearlyCents = sumEffectiveYearlyCents(subscriptions);
  const categoryCount = countCategories(subscriptions);
  const due = summarizeInvoices(
    invoicesInRollingWindow(projectedInvoices, now, DUE_WINDOW_DAYS),
  );
  const recorded = summarizeInvoices(recordedThisMonth);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card size="sm">
        <CardHeader className="gap-0.5">
          <span className={LABEL_CLASS}>Monthly cost</span>
          <span className={VALUE_CLASS}>
            <Money cents={monthlyCents} />
            <span className="ml-0.5 text-base font-normal text-muted-foreground">
              /mo
            </span>
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatCurrencyFromCents(yearlyCents)} per year
          </span>
        </CardHeader>
      </Card>

      <Card size="sm">
        <CardHeader className="gap-0.5">
          <span className={LABEL_CLASS}>Active subscriptions</span>
          <span className={VALUE_CLASS}>{subscriptions.length}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {categoryCount === 0
              ? 'No categories yet'
              : `Across ${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'}`}
          </span>
        </CardHeader>
      </Card>

      <Card size="sm">
        <CardHeader className="gap-0.5">
          <span className={LABEL_CLASS}>Due in {DUE_WINDOW_DAYS} days</span>
          <Money cents={due.totalCents} className={VALUE_CLASS} />
          <span className="text-xs text-muted-foreground tabular-nums">
            {due.count === 0
              ? 'Nothing due'
              : `${pluralize(due.count, 'expected invoice')}`}
          </span>
        </CardHeader>
      </Card>

      <Card size="sm">
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
            <Money cents={recorded.totalCents} className={VALUE_CLASS} />
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
