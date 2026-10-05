import { useId } from 'react';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { CollectionNotificationsData } from '@/features/notifications/queries';
import { SubscriptionIcon } from '@/features/subscriptions/components/subscription-icon';
import {
  formatCurrencyFromCents,
  frequencyUnit,
} from '@/features/subscriptions/cost';

export type InclusionSubscription =
  CollectionNotificationsData['subscriptions'][number];

type InclusionListProps = {
  subscriptions: InclusionSubscription[];
  isIncluded: (subscription: InclusionSubscription) => boolean;
  onChange: (subscription: InclusionSubscription, included: boolean) => void;
  disabled?: boolean;
};

/** Subscriptions with a switch each for whether they may appear in notifications. */
export function InclusionList({
  subscriptions,
  isIncluded,
  onChange,
  disabled,
}: InclusionListProps) {
  // The same subscriptions can be listed twice at once, such as on the
  // settings page and in the review dialog, so IDs need a per-list prefix.
  const listId = useId();

  return (
    <ul className="divide-y">
      {subscriptions.map((subscription) => {
        const included = isIncluded(subscription);
        const switchId = `${listId}-include-${subscription.id}`;

        return (
          <li
            key={subscription.id}
            className="flex items-center gap-3 px-(--card-spacing) py-2.5"
          >
            <SubscriptionIcon
              domain={subscription.iconRef}
              name={subscription.name}
              size="sm"
            />
            <label htmlFor={switchId} className="min-w-0 flex-1 cursor-pointer">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="truncate text-sm font-medium">
                  {subscription.name}
                </span>
                {subscription.status === 'inactive' ? (
                  <Badge variant="outline">Inactive</Badge>
                ) : null}
              </span>
              <span className="block text-xs text-muted-foreground tabular-nums">
                {formatCurrencyFromCents(subscription.costAmount)}
                {frequencyUnit(subscription.costFrequency)}
              </span>
            </label>
            <span className="w-16 text-right text-xs text-muted-foreground">
              {included ? 'Included' : 'Excluded'}
            </span>
            <Switch
              id={switchId}
              checked={included}
              onCheckedChange={(checked) => onChange(subscription, checked)}
              disabled={disabled}
              aria-label={`Include ${subscription.name} in notifications`}
            />
          </li>
        );
      })}
    </ul>
  );
}
