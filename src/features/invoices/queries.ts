import { queryOptions } from '@tanstack/react-query';

import { listInvoices, listInvoicesBySubscription } from '@/features/invoices/api';

export type InvoicesListData = Awaited<ReturnType<typeof listInvoices>>;
export type InvoiceRecord = InvoicesListData[number];

export const invoicesListQueryKey = ['invoices', 'list'] as const;

export function subscriptionInvoicesQueryKey(subscriptionId: string) {
  return ['invoices', 'by-subscription', subscriptionId] as const;
}

export function invoicesQueryOptions() {
  return queryOptions({
    queryKey: invoicesListQueryKey,
    queryFn: () => listInvoices(),
  });
}

export function subscriptionInvoicesQueryOptions(subscriptionId: string) {
  return queryOptions({
    queryKey: subscriptionInvoicesQueryKey(subscriptionId),
    queryFn: () => listInvoicesBySubscription({ data: { subscriptionId } }),
  });
}
