import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  buildMonthlyBreakdown,
  formatCurrencyFromCents,
  type CostInput,
} from '@/features/subscriptions/cost';

type MonthlyBreakdownProps = {
  items: CostInput[];
};

export function MonthlyBreakdown({ items }: MonthlyBreakdownProps) {
  const entries = buildMonthlyBreakdown(items);

  return (
    <Card className="gap-0 py-0 roomy:max-h-full roomy:min-h-0">
      <CardHeader className="shrink-0 border-b py-4">
        <CardTitle className="text-base">Monthly cost breakdown</CardTitle>
        <CardDescription>
          Projected invoices over the next 12 months
        </CardDescription>
      </CardHeader>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="divide-y">
          {entries.map((entry) => {
            return (
              <li
                key={entry.monthKey}
                className="flex items-center justify-between gap-3 px-6 py-2.5"
              >
                <span className="text-sm text-muted-foreground">
                  {entry.label}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrencyFromCents(entry.totalCents)}
                </span>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </Card>
  );
}
