import type { Subscription } from '@/features/subscriptions';
import { getSubscriptionsInMonth } from '@/features/subscriptions/filters';
import dayjs from '@/lib/dayjs';

export const ALL_MONTHS_FILTER = 'ALL';

type DashboardSubscriptionFilters = {
  searchQuery: string;
  selectedCategories: string[];
  selectedMonth: string;
};

export function filterDashboardSubscriptions(
  subscriptions: Subscription[],
  filters: DashboardSubscriptionFilters
): Subscription[] {
  const normalizedSearchQuery = filters.searchQuery.trim().toLowerCase();
  const selectedMonthDate =
    filters.selectedMonth === ALL_MONTHS_FILTER
      ? null
      : dayjs(filters.selectedMonth, 'MMM YYYY');

  return subscriptions.filter((subscription) => {
    const matchesSearch =
      normalizedSearchQuery.length === 0 ||
      subscription.name.toLowerCase().includes(normalizedSearchQuery);
    const matchesCategory =
      filters.selectedCategories.length === 0 ||
      filters.selectedCategories.includes(subscription.category);
    const matchesMonth =
      selectedMonthDate === null ||
      getSubscriptionsInMonth(
        [subscription],
        selectedMonthDate.month(),
        selectedMonthDate.year()
      ).length > 0;

    return matchesSearch && matchesCategory && matchesMonth;
  });
}
