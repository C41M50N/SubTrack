import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  const maxTotal = Math.max(...entries.map((entry) => entry.totalCents), 1);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">Monthly cost breakdown</CardTitle>
        <CardDescription>
          Projected invoices over the next 12 months
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {entries.map((entry) => {
            const width = (entry.totalCents / maxTotal) * 100;

            return (
              <li
                key={entry.monthKey}
                className="relative flex items-center justify-between gap-3 px-6 py-2.5"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-1 left-0 rounded-r-sm bg-primary/8"
                  style={{ width: `${width}%` }}
                />
                <span className="relative text-sm text-muted-foreground">
                  {entry.label}
                </span>
                <span className="relative text-sm font-medium tabular-nums">
                  {formatCurrencyFromCents(entry.totalCents)}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
