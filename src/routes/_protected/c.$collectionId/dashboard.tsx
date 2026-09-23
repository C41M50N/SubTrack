import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { PlusIcon, WalletIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { CategoryBreakdown } from '@/features/dashboard/components/category-breakdown';
import { DashboardMetrics } from '@/features/dashboard/components/dashboard-metrics';
import { InvoiceListCard } from '@/features/dashboard/components/invoice-list-card';
import { SpendTrendChart } from '@/features/dashboard/components/spend-trend-chart';
import {
  RECENT_LIST_LIMIT,
  UPCOMING_LIST_DAYS,
  buildCategoryBreakdown,
  buildSpendTrend,
  getRecordedTrendRange,
  invoicesInCurrentMonth,
} from '@/features/dashboard/domain';
import {
  getProjectionRange,
  invoicesInRollingWindow,
  projectInvoices,
  toRecordedInvoices,
} from '@/features/invoices/domain';
import { collectionInvoicesQueryOptions } from '@/features/invoices/queries';
import { subscriptionsQueryOptions } from '@/features/subscriptions/queries';

export const Route = createFileRoute('/_protected/c/$collectionId/dashboard')({
  loader: async ({ context, params }) => {
    // History is secondary: the page renders without it and the cards that
    // need it show their own loading state, so it is only prefetched.
    void context.queryClient.prefetchQuery(
      collectionInvoicesQueryOptions({
        collectionId: params.collectionId,
        ...getRecordedTrendRange(),
      }),
    );

    await context.queryClient.ensureQueryData(
      subscriptionsQueryOptions({
        collectionId: params.collectionId,
        status: 'active',
      }),
    );
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { collectionId } = Route.useParams();
  const [now] = useState(() => new Date());

  const { data: subscriptions } = useSuspenseQuery(
    subscriptionsQueryOptions({ collectionId, status: 'active' }),
  );
  const historyQuery = useQuery(
    collectionInvoicesQueryOptions({
      collectionId,
      ...getRecordedTrendRange(now),
    }),
  );

  const projectedInvoices = projectInvoices(
    subscriptions,
    getProjectionRange(now),
  );
  const recordedInvoices = toRecordedInvoices(historyQuery.data ?? []);
  const trend = buildSpendTrend(recordedInvoices, projectedInvoices, now);
  const categories = buildCategoryBreakdown(subscriptions);
  const upcoming = invoicesInRollingWindow(
    projectedInvoices,
    now,
    UPCOMING_LIST_DAYS,
  );
  const recent = recordedInvoices.slice(0, RECENT_LIST_LIMIT);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          An overview of spending across this collection.
        </p>
      </header>

      {subscriptions.length === 0 ? (
        <NoActiveSubscriptions collectionId={collectionId} />
      ) : (
        <>
          <DashboardMetrics
            subscriptions={subscriptions}
            projectedInvoices={projectedInvoices}
            recordedThisMonth={invoicesInCurrentMonth(recordedInvoices, now)}
            historyLoading={historyQuery.isPending}
            historyError={historyQuery.isError}
            onRetryHistory={() => void historyQuery.refetch()}
            now={now}
          />

          <div className="grid items-start gap-6 lg:grid-cols-3">
            <SpendTrendChart
              points={trend}
              isLoading={historyQuery.isPending}
              isError={historyQuery.isError}
              onRetry={() => void historyQuery.refetch()}
            />
            <CategoryBreakdown entries={categories} />
          </div>

          {/* On roomy viewports the row absorbs whatever height is left, floored so
              short screens fall back to page scrolling. The basis must be a
              length, not `flex-1`'s 0%: a percentage against the page's
              indefinite height resolves to the lists' full content height and
              would inflate the page's minimum height. */}
          <div className="grid items-start gap-6 md:grid-cols-2 roomy:min-h-80 roomy:flex-[1_1_0px] roomy:items-stretch">
            <InvoiceListCard
              title="Upcoming invoices"
              description={`Expected in the next ${UPCOMING_LIST_DAYS} days`}
              view="upcoming"
              collectionId={collectionId}
              invoices={upcoming}
              emptyMessage={`No invoices expected in the next ${UPCOMING_LIST_DAYS} days.`}
              now={now}
            />
            <InvoiceListCard
              title="Recently recorded"
              description="The latest invoices SubTrack has recorded"
              view="history"
              collectionId={collectionId}
              invoices={recent}
              emptyMessage="No invoices have been recorded yet."
              isLoading={historyQuery.isPending}
              isError={historyQuery.isError}
              onRetry={() => void historyQuery.refetch()}
              now={now}
            />
          </div>
        </>
      )}
    </div>
  );
}

function NoActiveSubscriptions({ collectionId }: { collectionId: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WalletIcon />
        </EmptyMedia>
        <EmptyTitle>No active subscriptions</EmptyTitle>
        <EmptyDescription>
          Add a subscription to see its cost, its schedule, and how spending
          adds up over time.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          nativeButton={false}
          render={
            <Link
              to="/c/$collectionId/subscriptions"
              params={{ collectionId }}
            />
          }
        >
          <PlusIcon data-icon="inline-start" />
          Go to subscriptions
        </Button>
      </EmptyContent>
    </Empty>
  );
}
