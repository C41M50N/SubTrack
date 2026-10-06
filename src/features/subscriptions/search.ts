export type SubscriptionView = 'active' | 'inactive';

export type SubscriptionRouteSearch = {
  view?: 'inactive';
};

export function validateSubscriptionSearch(search: Record<string, unknown>): SubscriptionRouteSearch {
  return { view: search.view === 'inactive' ? 'inactive' : undefined };
}

export function getSubscriptionView(search: SubscriptionRouteSearch): SubscriptionView {
  return search.view ?? 'active';
}

export function toSubscriptionRouteSearch(view: SubscriptionView): SubscriptionRouteSearch {
  return { view: view === 'inactive' ? 'inactive' : undefined };
}
