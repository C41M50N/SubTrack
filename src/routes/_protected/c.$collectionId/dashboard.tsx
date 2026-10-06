import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { PlusIcon, UploadIcon, WalletIcon } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { categoriesQueryOptions } from '@/features/categories/queries';
import { collectionsQueryOptions } from '@/features/collections/queries';
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
import { ImportSubscriptionsDialog } from '@/features/imports/components/import-subscriptions-dialog';
import { smartImportStatusQueryOptions } from '@/features/imports/queries';
import {
  getProjectionRange,
  invoicesInRollingWindow,
  projectInvoices,
  toRecordedInvoices,
} from '@/features/invoices/domain';
import { collectionInvoicesQueryOptions } from '@/features/invoices/queries';
import { ReminderInvitationDialog } from '@/features/onboarding/components/reminder-invitation-dialog';
import { WelcomePanel } from '@/features/onboarding/components/welcome-panel';
import { onboardingQueryOptions } from '@/features/onboarding/queries';
import { SubscriptionFormDialog } from '@/features/subscriptions/components/subscription-form-dialog';
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
    // Only needed once someone adds a subscription from the dashboard.
    void context.queryClient.prefetchQuery(
      categoriesQueryOptions(params.collectionId),
    );

    const [onboarding] = await Promise.all([
      context.queryClient.ensureQueryData(onboardingQueryOptions()),
      context.queryClient.ensureQueryData(
        subscriptionsQueryOptions({
          collectionId: params.collectionId,
          status: 'active',
        }),
      ),
    ]);

    // The welcome panel describes what the importer accepts.
    if (!onboarding.completed) {
      void context.queryClient.prefetchQuery(smartImportStatusQueryOptions());
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { collectionId } = Route.useParams();

  // Remounting per collection closes any open dialog, so an import or a new
  // subscription can't carry over to another collection.
  return <CollectionDashboard key={collectionId} collectionId={collectionId} />;
}

type EntryDialog = 'import' | 'create';

function CollectionDashboard({ collectionId }: { collectionId: string }) {
  const [now] = useState(() => new Date());
  const [entryDialog, setEntryDialog] = useState<EntryDialog | null>(null);
  // Stays true through the close animation, so the reminder invitation can't
  // open until the dialog that saved the subscription has returned focus.
  const [entryDialogShown, setEntryDialogShown] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const entryTriggerRef = useRef<HTMLElement | null>(null);

  const { data: subscriptions } = useSuspenseQuery(
    subscriptionsQueryOptions({ collectionId, status: 'active' }),
  );
  const { data: onboarding } = useSuspenseQuery(onboardingQueryOptions());
  const { data: collections } = useSuspenseQuery(collectionsQueryOptions());
  const { data: categoryOptions = [] } = useQuery(
    categoriesQueryOptions(collectionId),
  );
  const collection = {
    id: collectionId,
    name:
      collections.find((candidate) => candidate.id === collectionId)?.name ??
      'this collection',
  };
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

  function openEntryDialog(dialog: EntryDialog, trigger: HTMLElement) {
    entryTriggerRef.current = trigger;
    setEntryDialog(dialog);
    setEntryDialogShown(true);
  }

  // A first save replaces the welcome panel, taking the button that opened the
  // dialog with it, so focus falls back to the heading.
  function getEntryFinalFocus() {
    return entryTriggerRef.current?.isConnected
      ? entryTriggerRef.current
      : headingRef.current;
  }

  function handleEntryOpenChange(open: boolean) {
    if (!open) {
      setEntryDialog(null);
    }
  }

  function handleEntryOpenChangeComplete(open: boolean) {
    if (!open) {
      setEntryDialogShown(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-heading text-2xl font-semibold outline-none"
        >
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Spending and renewals for the subscriptions tracked in this
          collection.
        </p>
      </header>

      {!onboarding.completed && subscriptions.length === 0 ? (
        <WelcomePanel
          onImport={(trigger) => openEntryDialog('import', trigger)}
          onAdd={(trigger) => openEntryDialog('create', trigger)}
        />
      ) : subscriptions.length === 0 ? (
        <NoActiveSubscriptions
          onImport={(trigger) => openEntryDialog('import', trigger)}
          onAdd={(trigger) => openEntryDialog('create', trigger)}
        />
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
            <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
              <SpendTrendChart
                points={trend}
                isLoading={historyQuery.isPending}
                isError={historyQuery.isError}
                onRetry={() => void historyQuery.refetch()}
              />
              <InvoiceListCard
                title="Upcoming invoices"
                description={`Expected in the next ${UPCOMING_LIST_DAYS} days`}
                view="upcoming"
                collectionId={collectionId}
                invoices={upcoming}
                emptyMessage={`No invoices expected in the next ${UPCOMING_LIST_DAYS} days.`}
                now={now}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-6">
              <CategoryBreakdown entries={categories} />
              <InvoiceListCard
                title="Recently recorded"
                description="The latest invoices EverySub has recorded"
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
          </div>
        </>
      )}

      <ImportSubscriptionsDialog
        collection={collection}
        open={entryDialog === 'import'}
        onOpenChange={handleEntryOpenChange}
        onOpenChangeComplete={handleEntryOpenChangeComplete}
        finalFocus={getEntryFinalFocus}
      />

      <SubscriptionFormDialog
        open={entryDialog === 'create'}
        onOpenChange={handleEntryOpenChange}
        collectionId={collectionId}
        categories={categoryOptions}
        onOpenChangeComplete={handleEntryOpenChangeComplete}
        finalFocus={getEntryFinalFocus}
      />

      <ReminderInvitationDialog
        invitation={onboarding.reminderInvitation}
        ready={!entryDialogShown}
        fallbackCollection={collection}
        finalFocus={headingRef}
      />
    </div>
  );
}

type EntryActionsProps = {
  onImport: (trigger: HTMLElement) => void;
  onAdd: (trigger: HTMLElement) => void;
};

function NoActiveSubscriptions({ onImport, onAdd }: EntryActionsProps) {
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
      <EmptyContent className="flex-row justify-center">
        <Button
          variant="outline"
          onClick={(event) => onImport(event.currentTarget)}
        >
          <UploadIcon data-icon="inline-start" />
          Import
        </Button>
        <Button onClick={(event) => onAdd(event.currentTarget)}>
          <PlusIcon data-icon="inline-start" />
          Add subscription
        </Button>
      </EmptyContent>
    </Empty>
  );
}
