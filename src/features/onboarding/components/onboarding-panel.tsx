import { useQuery } from '@tanstack/react-query';
import { ArrowRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { smartImportStatusQueryOptions } from '@/features/imports/queries';
import { ImportDropZone } from '@/features/onboarding/components/import-drop-zone';
import { QuickAddCard } from '@/features/onboarding/components/quick-add-card';
import type { PopularService } from '@/features/onboarding/popular-services';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';

type OnboardingPanelProps = {
  /** The page heading, which focus falls back to. */
  headingRef: React.Ref<HTMLHeadingElement>;
  subscriptions: SubscriptionRecord[];
  onImportFiles: (files: File[], trigger: HTMLElement) => void;
  onAddService: (service: PopularService, trigger: HTMLElement) => void;
  onAddByHand: (name: string, trigger: HTMLElement) => void;
  /** Leaves onboarding for the full dashboard. */
  onFinish: () => void;
  /** The dashboard's metrics, shown as a preview that fills in. */
  metrics: React.ReactNode;
};

/** Names shown before the rest are counted, as in "Netflix, Spotify, and 3 more". */
const NAMED_LIMIT = 3;

const listFormat = new Intl.ListFormat('en', {
  style: 'long',
  type: 'conjunction',
});

/**
 * The dashboard's first-run state. It stays up while someone adds what they
 * know, with the dashboard's own figures filling in below, and hands over to
 * the full dashboard when they're done.
 */
export function OnboardingPanel({
  headingRef,
  subscriptions,
  onImportFiles,
  onAddService,
  onAddByHand,
  onFinish,
  metrics,
}: OnboardingPanelProps) {
  const { data: smartImport } = useQuery(smartImportStatusQueryOptions());
  // Until the status loads, describe the full importer, as the importer does.
  const canReadFiles = smartImport?.configured ?? true;
  const count = subscriptions.length;
  const hasSubscriptions = count > 0;

  return (
    <div className="flex flex-col gap-9 pt-2">
      <header className="flex flex-col gap-3.5">
        <p className="text-sm font-semibold tracking-[0.02em] text-primary dark:text-primary-light">
          {hasSubscriptions
            ? `${count} ${count === 1 ? 'subscription' : 'subscriptions'} added`
            : 'Welcome to EverySub'}
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-5xl/[1.08] font-normal tracking-[-0.04em] text-balance outline-none"
        >
          {hasSubscriptions
            ? 'Nice start. What else do you pay for?'
            : 'Let’s add up what you pay for.'}
        </h1>
        <p className="max-w-155 text-[17px]/7 text-pretty text-muted-foreground">
          {hasSubscriptions
            ? `${describeAdded(subscriptions)} ${count === 1 ? 'is' : 'are'} on your dashboard. Add the rest the same way${canReadFiles ? ', or drop in a statement to catch the ones you’ve forgotten.' : '.'}`
            : `Start with ${canReadFiles ? 'a statement' : 'an EverySub export'}, or with the services you already know. Your dashboard fills in with monthly costs and upcoming renewals as you go.`}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]">
        <ImportDropZone
          canReadFiles={canReadFiles}
          hasSubscriptions={hasSubscriptions}
          onFiles={onImportFiles}
        />
        <QuickAddCard
          subscriptions={subscriptions}
          onAddService={onAddService}
          onAddByHand={onAddByHand}
        />
      </div>

      <section
        aria-labelledby="dashboard-preview-title"
        className="flex flex-col gap-3"
      >
        <div className="flex min-h-9 items-center justify-between gap-4">
          <h2
            id="dashboard-preview-title"
            className="text-xs font-semibold tracking-widest text-muted-foreground uppercase"
          >
            Your dashboard so far
          </h2>
          {hasSubscriptions ? (
            <Button
              variant="ghost"
              className="bg-primary/10 px-3.5 font-semibold text-primary hover:bg-primary/15 hover:text-primary dark:bg-primary-light/15 dark:text-primary-light dark:hover:bg-primary-light/20 dark:hover:text-primary-light"
              onClick={onFinish}
            >
              See your dashboard
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Fills in as you add subscriptions
            </p>
          )}
        </div>
        {metrics}
      </section>
    </div>
  );
}

/** "Netflix, Spotify, and iCloud+", in the order they were added. */
function describeAdded(subscriptions: SubscriptionRecord[]): string {
  const names = [...subscriptions]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((subscription) => subscription.name);

  if (names.length <= NAMED_LIMIT) {
    return listFormat.format(names);
  }

  const shown = names.slice(0, NAMED_LIMIT - 1);

  return listFormat.format([...shown, `${names.length - shown.length} more`]);
}
