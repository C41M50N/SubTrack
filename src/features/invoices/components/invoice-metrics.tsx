import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  ProjectedInvoice,
  RecordedInvoice,
} from '@/features/invoices/domain';
import {
  invoicesInRollingWindow,
  summarizeInvoices,
} from '@/features/invoices/domain';
import { SubscriptionIcon } from '@/features/subscriptions/components/subscription-icon';
import { formatCurrencyFromCents } from '@/features/subscriptions/cost';
import { formatInvoiceDistance } from '@/features/subscriptions/format';

const LABEL_CLASS =
  'text-xs font-semibold uppercase tracking-widest text-muted-foreground';

type InvoiceMetricsProps = {
  projectedInvoices: ProjectedInvoice[];
  recordedInvoices: RecordedInvoice[];
  subscriptionsLoading: boolean;
  subscriptionsError: boolean;
  historyLoading: boolean;
  historyError: boolean;
  onRetrySubscriptions: () => void;
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

export function InvoiceMetrics({
  projectedInvoices,
  recordedInvoices,
  subscriptionsLoading,
  subscriptionsError,
  historyLoading,
  historyError,
  onRetrySubscriptions,
  onRetryHistory,
  now,
}: InvoiceMetricsProps) {
  const recorded = summarizeInvoices(recordedInvoices);
  const due = summarizeInvoices(
    invoicesInRollingWindow(projectedInvoices, now),
  );
  const nextInvoice = projectedInvoices[0] ?? null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card size="sm">
        <CardHeader className="gap-0.5">
          <span className={LABEL_CLASS}>Recorded this month</span>
          {historyLoading ? (
            <Skeleton className="my-1 h-9 w-32" />
          ) : historyError ? (
            <button
              className="w-fit text-left text-sm font-medium text-destructive underline underline-offset-4"
              onClick={onRetryHistory}
            >
              Retry history
            </button>
          ) : (
            <Money
              cents={recorded.totalCents}
              className="font-heading text-3xl font-semibold tracking-tight tabular-nums"
            />
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            {historyError
              ? 'History unavailable'
              : `${recorded.count} recorded ${recorded.count === 1 ? 'invoice' : 'invoices'}`}
          </span>
        </CardHeader>
      </Card>

      <Card size="sm">
        <CardHeader className="gap-0.5">
          <span className={LABEL_CLASS}>Due in 30 days</span>
          {subscriptionsLoading ? (
            <Skeleton className="my-1 h-9 w-32" />
          ) : subscriptionsError ? (
            <button
              className="w-fit text-left text-sm font-medium text-destructive underline underline-offset-4"
              onClick={onRetrySubscriptions}
            >
              Retry schedule
            </button>
          ) : (
            <Money
              cents={due.totalCents}
              className="font-heading text-3xl font-semibold tracking-tight tabular-nums"
            />
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            {subscriptionsLoading
              ? 'Calculating schedule'
              : subscriptionsError
                ? 'Schedule unavailable'
                : `${due.count} expected ${due.count === 1 ? 'invoice' : 'invoices'}`}
          </span>
        </CardHeader>
      </Card>

      <Card size="sm">
        <CardHeader className="gap-2">
          <span className={LABEL_CLASS}>Next invoice</span>
          {subscriptionsLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          ) : subscriptionsError ? (
            <div>
              <button
                className="text-sm font-medium text-destructive underline underline-offset-4"
                onClick={onRetrySubscriptions}
              >
                Retry schedule
              </button>
              <div className="mt-1 text-xs text-muted-foreground">
                Next invoice unavailable
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {nextInvoice ? (
                <SubscriptionIcon
                  domain={nextInvoice.iconRef}
                  name={nextInvoice.name}
                  size="lg"
                />
              ) : null}
              <div className="min-w-0">
                <div className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
                  {nextInvoice ? <Money cents={nextInvoice.amount} /> : '—'}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {nextInvoice
                    ? `${nextInvoice.name} · ${formatInvoiceDistance(nextInvoice.date, now)}`
                    : 'Nothing scheduled'}
                </div>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>
    </div>
  );
}
