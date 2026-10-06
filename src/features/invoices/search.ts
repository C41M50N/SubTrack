import { toMonthKey, type InvoiceView } from '@/features/invoices/domain';

export type InvoiceRouteSearch = {
  view?: InvoiceView;
  month?: string;
};

export type InvoiceRouteState = {
  view: InvoiceView;
  month: string;
};

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function validateInvoiceSearch(search: Record<string, unknown>): InvoiceRouteSearch {
  return {
    view: search.view === 'history' ? 'history' : undefined,
    month: typeof search.month === 'string' && MONTH_PATTERN.test(search.month) ? search.month : undefined,
  };
}

export function getInvoiceRouteState(search: InvoiceRouteSearch, now: Date = new Date()): InvoiceRouteState {
  return {
    view: search.view ?? 'upcoming',
    month: search.month ?? toMonthKey(now),
  };
}

export function toInvoiceRouteSearch(state: InvoiceRouteState, now: Date = new Date()): InvoiceRouteSearch {
  const currentMonth = toMonthKey(now);

  return {
    view: state.view === 'history' ? 'history' : undefined,
    month: state.month === currentMonth ? undefined : state.month,
  };
}
