import type { SortingState } from '@tanstack/react-table';

import type { SubscriptionView } from '@/features/subscriptions/search';

export function getDefaultSubscriptionSorting(view: SubscriptionView): SortingState {
  return [{ id: view === 'active' ? 'nextInvoiceDate' : 'deactivatedAt', desc: view === 'inactive' }];
}
