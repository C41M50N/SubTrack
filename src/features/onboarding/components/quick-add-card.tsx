import {
  ArrowRightIcon,
  CheckIcon,
  PencilLineIcon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react';
import { useId, useState } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  findSubscriptionNamed,
  findTrackedSubscription,
  QUICK_ADD_LIMIT,
  searchPopularServices,
  type PopularService,
} from '@/features/onboarding/popular-services';
import { SubscriptionIcon } from '@/features/subscriptions/components/subscription-icon';
import {
  formatCurrencyFromCents,
  frequencyUnit,
} from '@/features/subscriptions/cost';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';

type QuickAddCardProps = {
  /** The collection's subscriptions, so services already tracked show as added. */
  subscriptions: SubscriptionRecord[];
  onAddService: (service: PopularService, trigger: HTMLElement) => void;
  /** Opens the form by hand, with a name to start from if one was searched. */
  onAddByHand: (name: string, trigger: HTMLElement) => void;
};

/**
 * Adds a service someone already knows they pay for, starting from its name
 * and logo. Services already tracked stay listed with what they cost, so each
 * addition is confirmed in place.
 */
export function QuickAddCard({
  subscriptions,
  onAddService,
  onAddByHand,
}: QuickAddCardProps) {
  const titleId = useId();
  const [query, setQuery] = useState('');
  const customName = query.trim();
  const search = searchPopularServices(query);
  const offerCustomName = customName.length > 0 && !search.exactMatch;
  // The list keeps its height, so the custom name takes the last row.
  const services = offerCustomName
    ? search.services.slice(0, QUICK_ADD_LIMIT - 1)
    : search.services;
  const rows = services.map((service) => ({
    service,
    tracked: findTrackedSubscription(service, subscriptions),
  }));
  const customTracked = offerCustomName
    ? findSubscriptionNamed(customName, subscriptions)
    : undefined;

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    const first = rows.find((row) => !row.tracked);

    if (first) {
      onAddService(first.service, event.currentTarget);
    } else if (offerCustomName && !customTracked) {
      onAddByHand(customName, event.currentTarget);
    }
  }

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col rounded-2xl bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10"
    >
      <div className="flex flex-col gap-1.5 px-8 pt-8 pb-5">
        <h2 id={titleId} className="text-xl font-semibold tracking-[-0.015em]">
          Or add one you know
        </h2>
        <p className="text-[15px]/6 text-muted-foreground">
          Pick one, then fill in what you pay.
        </p>
      </div>

      <div className="px-8">
        <InputGroup className="h-10.5">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search services"
            aria-label="Search services"
            autoComplete="off"
          />
        </InputGroup>
      </div>

      {/* Fixed to four rows, so searching never resizes the card. */}
      <ul className="mx-6 flex min-h-52 flex-col py-2">
        {rows.map(({ service, tracked }) => (
          <li key={service.name}>
            <QuickAddRow
              icon={
                <SubscriptionIcon domain={service.domain} name={service.name} />
              }
              name={service.name}
              addLabel={`Add ${service.name}`}
              detail={service.kind}
              tracked={tracked}
              onAdd={(trigger) => onAddService(service, trigger)}
            />
          </li>
        ))}
        {offerCustomName ? (
          <li>
            <QuickAddRow
              icon={
                customTracked ? (
                  <SubscriptionIcon
                    domain={customTracked.iconRef}
                    name={customTracked.name}
                  />
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-border ring-inset">
                    <PencilLineIcon className="size-4" aria-hidden />
                  </span>
                )
              }
              name={customTracked ? customTracked.name : `Add “${customName}”`}
              addLabel={`Add “${customName}”`}
              detail="Fill in the details yourself"
              tracked={customTracked}
              onAdd={(trigger) => onAddByHand(customName, trigger)}
            />
          </li>
        ) : null}
      </ul>

      <p role="status" className="sr-only">
        {customName.length > 0
          ? `${services.length} ${services.length === 1 ? 'service' : 'services'} found`
          : ''}
      </p>

      <div className="mx-8 border-t">
        <button
          type="button"
          className="group/manual flex h-14 w-full items-center gap-2.5 text-sm font-semibold text-primary outline-none focus-visible:underline dark:text-primary-light"
          onClick={(event) => onAddByHand('', event.currentTarget)}
        >
          <PencilLineIcon className="size-4" aria-hidden />
          <span className="flex-1 text-left">Add something else by hand</span>
          <ArrowRightIcon
            className="size-4 transition-transform duration-150 ease-out group-hover/manual:translate-x-0.5"
            aria-hidden
          />
        </button>
      </div>
    </section>
  );
}

type QuickAddRowProps = {
  icon: React.ReactNode;
  name: string;
  /** Names the button while it still adds something. */
  addLabel: string;
  detail: string;
  /** The subscription already tracking this, which turns the row into a confirmation. */
  tracked: Pick<SubscriptionRecord, 'costAmount' | 'costFrequency'> | undefined;
  onAdd: (trigger: HTMLElement) => void;
};

/**
 * One service in the list. It stays the same button once added, so focus can
 * return to it when the form that added it closes.
 */
function QuickAddRow({
  icon,
  name,
  addLabel,
  detail,
  tracked,
  onAdd,
}: QuickAddRowProps) {
  return (
    <button
      type="button"
      aria-disabled={tracked ? true : undefined}
      aria-label={tracked ? undefined : addLabel}
      className="group/row flex h-12 w-full items-center gap-3 rounded-lg px-2 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:cursor-default aria-disabled:hover:bg-transparent"
      onClick={(event) => {
        if (!tracked) {
          onAdd(event.currentTarget);
        }
      }}
    >
      {icon}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{name}</span>
        {tracked ? (
          <span className="truncate text-[13px]/4 font-medium text-primary dark:text-primary-light">
            Added · {formatCurrencyFromCents(tracked.costAmount)}
            {frequencyUnit(tracked.costFrequency)}
          </span>
        ) : (
          <span className="truncate text-[13px]/4 text-muted-foreground">
            {detail}
          </span>
        )}
      </span>
      {tracked ? (
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary-light/15 dark:text-primary-light"
        >
          <CheckIcon className="size-4" strokeWidth={2.5} />
        </span>
      ) : (
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-foreground/80 shadow-xs transition-colors group-hover/row:border-foreground/20 group-hover/row:text-foreground"
        >
          <PlusIcon className="size-4" />
        </span>
      )}
    </button>
  );
}
