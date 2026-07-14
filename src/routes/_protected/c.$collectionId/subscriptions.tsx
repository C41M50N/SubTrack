import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { categoriesQueryOptions } from '@/features/categories/queries';
import { CostMetrics } from '@/features/subscriptions/components/cost-metrics';
import { DeleteSubscriptionDialog } from '@/features/subscriptions/components/delete-subscription-dialog';
import { MonthlyBreakdown } from '@/features/subscriptions/components/monthly-breakdown';
import { SubscriptionFormDialog } from '@/features/subscriptions/components/subscription-form-dialog';
import {
  SubscriptionsTable,
  useSubscriptionsTable,
} from '@/features/subscriptions/components/subscriptions-table';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';
import { subscriptionsQueryOptions } from '@/features/subscriptions/queries';

export const Route = createFileRoute(
  '/_protected/c/$collectionId/subscriptions',
)({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        subscriptionsQueryOptions({
          collectionId: params.collectionId,
          status: 'active',
        }),
      ),
      context.queryClient.ensureQueryData(
        categoriesQueryOptions(params.collectionId),
      ),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { collectionId } = Route.useParams();
  const { data } = useSuspenseQuery(
    subscriptionsQueryOptions({ collectionId, status: 'active' }),
  );
  const { data: categories } = useSuspenseQuery(
    categoriesQueryOptions(collectionId),
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubscriptionRecord | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<SubscriptionRecord[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleEdit = useCallback((subscription: SubscriptionRecord) => {
    setEditTarget(subscription);
  }, []);

  const handleDelete = useCallback((subscription: SubscriptionRecord) => {
    setDeleteTargets([subscription]);
    setDeleteOpen(true);
  }, []);

  const table = useSubscriptionsTable({
    data,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const visibleRows = table.getFilteredRowModel().rows;
  const baseRows = selectedRows.length > 0 ? selectedRows : visibleRows;
  const baseItems = baseRows.map((row) => row.original);

  function handleBulkDelete() {
    setDeleteTargets(selectedRows.map((row) => row.original));
    setDeleteOpen(true);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">
            Track spending across this collection.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" />
          Add subscription
        </Button>
      </header>

      <CostMetrics
        items={baseItems}
        basis={selectedRows.length > 0 ? 'selected' : 'visible'}
        count={baseItems.length}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SubscriptionsTable
            table={table}
            categories={categories}
            onBulkDelete={handleBulkDelete}
          />
        </div>
        <MonthlyBreakdown items={baseItems} />
      </div>

      <SubscriptionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        collectionId={collectionId}
        categories={categories}
      />

      <SubscriptionFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        collectionId={collectionId}
        subscription={editTarget}
        categories={categories}
      />

      <DeleteSubscriptionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        subscriptions={deleteTargets}
        onDeleted={() => table.resetRowSelection()}
      />
    </div>
  );
}
