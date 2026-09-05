import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CategoryShare } from '@/features/dashboard/domain';
import { formatCurrencyFromCents } from '@/features/subscriptions/cost';

type CategoryBreakdownProps = {
  entries: CategoryShare[];
};

/**
 * Ranked list of categories by effective monthly cost.
 *
 * A bar per row rather than a donut: the ranking and the amounts are the
 * point, and a list keeps both legible at any number of categories.
 */
export function CategoryBreakdown({ entries }: CategoryBreakdownProps) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">Spend by category</CardTitle>
        <CardDescription>Effective monthly cost</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-80">
          <ul className="divide-y">
            {entries.map((entry) => (
              <li key={entry.category} className="px-6 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium">
                    {entry.category}
                  </span>
                  <span
                    className="shrink-0 text-sm font-medium tabular-nums"
                    aria-label={`${(entry.monthlyCents / 100).toFixed(2)} US dollars per month`}
                  >
                    {formatCurrencyFromCents(entry.monthlyCents)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <div
                    role="meter"
                    aria-label={`${entry.category} share of monthly cost`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(entry.share * 100)}
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/15"
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${entry.share * 100}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {Math.round(entry.share * 100)}% ·{' '}
                    {entry.count === 1 ? '1 sub' : `${entry.count} subs`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
