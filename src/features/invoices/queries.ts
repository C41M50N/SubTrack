import { queryOptions } from '@tanstack/react-query';

import { listInvoices, listInvoicesByCollection, listInvoicesBySubscription } from '@/features/invoices/api';

export type InvoicesListData = Awaited<ReturnType<typeof listInvoices>>;
export type InvoiceRecord = InvoicesListData[number];

export const invoicesListQueryKey = ['invoices', 'list'] as const;

export function collectionInvoicesQueryKey(collectionId: string) {
  return ['invoices', 'by-collection', collectionId] as const;
}

export function subscriptionInvoicesQueryKey(subscriptionId: string) {
  return ['invoices', 'by-subscription', subscriptionId] as const;
}

export function invoicesQueryOptions() {
  return queryOptions({
    queryKey: invoicesListQueryKey,
    queryFn: () => listInvoices(),
  });
}

export function collectionInvoicesQueryOptions(collectionId: string) {
  return queryOptions({
    queryKey: collectionInvoicesQueryKey(collectionId),
    queryFn: () => listInvoicesByCollection({ data: { collectionId } }),
  });
}

export function subscriptionInvoicesQueryOptions(subscriptionId: string) {
  return queryOptions({
    queryKey: subscriptionInvoicesQueryKey(subscriptionId),
    queryFn: () => listInvoicesBySubscription({ data: { subscriptionId } }),
  });
}
