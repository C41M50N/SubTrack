import { SubscriptionInsightsPanel } from '@/components/dashboard/subscription-insights-panel';
import { SubscriptionsTableSection } from '@/components/dashboard/subscriptions-table-section';
import { DashboardModalHost } from '@/components/subscriptions-table/dashboard-modal-host';
import { Separator } from '@/components/ui/separator';
import { useDashboardSubscriptionsView } from '@/features/dashboard/use-dashboard-subscriptions-view';
import MainLayout from '@/layouts/main';

export default function DashboardPage() {
  const {
    user,
    categories,
    collections,
    isCategoriesLoading,
    isSubscriptionsLoading,
    refetchCategories,
    resetFilters,
    rowSelection,
    searchQuery,
    selectedCategories,
    selectedMonth,
    setRowSelection,
    setSearchQuery,
    setSelectedCategories,
    setSelectedMonth,
    subscriptions,
    subscriptionsForInsights,
    tableColumns,
    visibleSubscriptions,
  } = useDashboardSubscriptionsView();

  return (
    <MainLayout title="Dashboard | SubTrack">
      <h1 className="pt-4 pb-1 text-2xl">Dashboard</h1>
      <p className="text-muted-foreground">Track your subscriptions here.</p>
      <Separator className="mt-4 mb-6" />

      <div className="flex flex-row gap-6">
        <div className="w-full">
          <SubscriptionsTableSection
            categories={categories || []}
            columns={tableColumns}
            data={visibleSubscriptions}
            isCategoriesLoading={isCategoriesLoading}
            isSubscriptionsLoading={isSubscriptionsLoading}
            onResetFilters={resetFilters}
            onRowSelectionChange={setRowSelection}
            onSearchQueryChange={setSearchQuery}
            onSelectedCategoriesChange={setSelectedCategories}
            onSelectedMonthChange={setSelectedMonth}
            rowSelection={rowSelection}
            searchQuery={searchQuery}
            selectedCategories={selectedCategories}
            selectedMonth={selectedMonth}
            showTable={Boolean(user && subscriptions && !isSubscriptionsLoading)}
          />
        </div>

        <SubscriptionInsightsPanel
          isSubscriptionsLoading={isSubscriptionsLoading}
          subscriptions={subscriptions}
          subscriptionsForInsights={subscriptionsForInsights}
        />
      </div>

      {categories && collections && (
        <DashboardModalHost
          categories={categories}
          collections={collections}
          onManageCategoriesClose={refetchCategories}
        />
      )}
    </MainLayout>
  );
}
