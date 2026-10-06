import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

import { InvoiceCalendar } from '@/features/invoices/components/invoice-calendar';
import { InvoiceMetrics } from '@/features/invoices/components/invoice-metrics';
import { InvoiceTable } from '@/features/invoices/components/invoice-table';
import {
  getCurrentMonthRange,
  getMonthRange,
  getProjectionMonthBounds,
  getProjectionRange,
  invoicesInMonth,
  projectInvoices,
  toMonthKey,
  toRecordedInvoices,
  type InvoiceItem,
  type InvoiceView,
} from '@/features/invoices/domain';
import { collectionInvoicesQueryOptions } from '@/features/invoices/queries';
import {
  getInvoiceRouteState,
  toInvoiceRouteSearch,
  validateInvoiceSearch,
} from '@/features/invoices/search';
import { subscriptionsQueryOptions } from '@/features/subscriptions/queries';

export const Route = createFileRoute('/_protected/c/$collectionId/invoices')({
  validateSearch: validateInvoiceSearch,
  loaderDeps: ({ search }) => getInvoiceRouteState(search),
  loader: ({ context, params, deps }) => {
    const currentRange = getCurrentMonthRange();

    void context.queryClient.prefetchQuery(
      subscriptionsQueryOptions({
        collectionId: params.collectionId,
        status: 'active',
      }),
    );
    void context.queryClient.prefetchQuery(
      collectionInvoicesQueryOptions({
        collectionId: params.collectionId,
        ...currentRange,
      }),
    );

    if (deps.view === 'history') {
      const activeRange = getMonthRange(deps.month);

      void context.queryClient.prefetchQuery(
        collectionInvoicesQueryOptions({
          collectionId: params.collectionId,
          ...activeRange,
        }),
      );
    }
  },
  component: InvoicesPage,
});

function InvoicesPage() {
  const { collectionId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [now] = useState(() => new Date());
  const { view, month } = getInvoiceRouteState(search, now);
  const currentMonth = toMonthKey(now);
  const currentRange = getCurrentMonthRange(now);
  const activeRange = getMonthRange(month);
  const projectionRange = getProjectionRange(now);

  const subscriptionsQuery = useQuery(
    subscriptionsQueryOptions({ collectionId, status: 'active' }),
  );
  const currentHistoryQuery = useQuery(
    collectionInvoicesQueryOptions({ collectionId, ...currentRange }),
  );
  const activeHistoryQuery = useQuery({
    ...collectionInvoicesQueryOptions({ collectionId, ...activeRange }),
    enabled: view === 'history',
  });

  const projectedInvoices = projectInvoices(
    subscriptionsQuery.data ?? [],
    projectionRange,
  );
  const currentRecordedInvoices = toRecordedInvoices(
    currentHistoryQuery.data ?? [],
  );
  const activeInvoices: InvoiceItem[] =
    view === 'upcoming'
      ? invoicesInMonth(projectedInvoices, month)
      : toRecordedInvoices(activeHistoryQuery.data ?? []);
  const monthLabel = format(parseISO(`${month}-01`), 'MMMM yyyy');
  const projectionBounds = getProjectionMonthBounds(now);

  function updateRoute(next: { view: InvoiceView; month: string }) {
    void navigate({ search: toInvoiceRouteSearch(next, now) });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 roomy:min-h-0">
      <header>
        <h1 className="font-heading text-2xl font-semibold">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Review recorded charges and see what is coming up.
        </p>
      </header>

      <InvoiceMetrics
        projectedInvoices={projectedInvoices}
        recordedInvoices={currentRecordedInvoices}
        subscriptionsLoading={subscriptionsQuery.isPending}
        subscriptionsError={subscriptionsQuery.isError}
        historyLoading={currentHistoryQuery.isPending}
        historyError={currentHistoryQuery.isError}
        onRetrySubscriptions={() => void subscriptionsQuery.refetch()}
        onRetryHistory={() => void currentHistoryQuery.refetch()}
        now={now}
      />

      <div
        key={view}
        className="grid items-start gap-6 lg:grid-cols-3 roomy:mb-2 roomy:h-0 roomy:min-h-0 roomy:flex-1"
      >
        <div className="order-2 flex flex-col lg:order-1 lg:col-span-2 roomy:h-full roomy:min-h-0">
          <InvoiceTable
            view={view}
            monthLabel={monthLabel}
            invoices={activeInvoices}
            collectionId={collectionId}
            onViewChange={(nextView) => updateRoute({ view: nextView, month })}
            isLoading={
              view === 'upcoming'
                ? subscriptionsQuery.isPending
                : activeHistoryQuery.isPending
            }
            isError={
              view === 'upcoming'
                ? subscriptionsQuery.isError
                : activeHistoryQuery.isError
            }
            hasActiveSubscriptions={(subscriptionsQuery.data?.length ?? 0) > 0}
            onRetry={() =>
              void (view === 'upcoming'
                ? subscriptionsQuery.refetch()
                : activeHistoryQuery.refetch())
            }
          />
        </div>
        <div className="order-1 lg:order-2 roomy:h-full roomy:min-h-0">
          <InvoiceCalendar
            key={`${month}:${view === 'upcoming' ? subscriptionsQuery.isPending : activeHistoryQuery.isPending}`}
            view={view}
            month={month}
            monthLabel={monthLabel}
            invoices={activeInvoices}
            isLoading={
              view === 'upcoming'
                ? subscriptionsQuery.isPending
                : activeHistoryQuery.isPending
            }
            isError={
              view === 'upcoming'
                ? subscriptionsQuery.isError
                : activeHistoryQuery.isError
            }
            startMonth={
              view === 'upcoming' ? projectionBounds.firstMonth : undefined
            }
            endMonth={
              view === 'upcoming' ? projectionBounds.lastMonth : undefined
            }
            onMonthChange={(date) =>
              updateRoute({ view, month: toMonthKey(date) })
            }
            now={now}
          />
        </div>
      </div>

      <span className="sr-only" aria-live="polite">
        Showing {view === 'upcoming' ? 'upcoming invoices' : 'invoice history'}{' '}
        for {monthLabel}
        {month === currentMonth ? ', the current month' : ''}.
      </span>
    </div>
  );
}
