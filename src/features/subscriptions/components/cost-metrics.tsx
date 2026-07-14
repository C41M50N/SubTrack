import { CalendarRangeIcon, WalletIcon } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  formatCurrencyFromCents,
  sumEffectiveMonthlyCents,
  sumEffectiveYearlyCents,
  type CostInput,
} from '@/features/subscriptions/cost';

type CostMetricsProps = {
  items: CostInput[];
  basis: 'selected' | 'visible';
  count: number;
};

function basisLabel(basis: 'selected' | 'visible', count: number): string {
  const noun = count === 1 ? 'subscription' : 'subscriptions';

  return basis === 'selected'
    ? `Based on ${count} selected ${noun}`
    : `Based on all ${count} visible ${noun}`;
}

export function CostMetrics({ items, basis, count }: CostMetricsProps) {
  const monthly = sumEffectiveMonthlyCents(items);
  const yearly = sumEffectiveYearlyCents(items);
  const label = basisLabel(basis, count);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <MetricCard
        icon={<WalletIcon className="size-4" />}
        title="Effective cost per month"
        value={formatCurrencyFromCents(monthly)}
        description={label}
      />
      <MetricCard
        icon={<CalendarRangeIcon className="size-4" />}
        title="Effective cost per year"
        value={formatCurrencyFromCents(yearly)}
        description={label}
      />
    </div>
  );
}

type MetricCardProps = {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
};

function MetricCard({ icon, title, value, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-inset ring-border">
            {icon}
          </span>
          {title}
        </CardDescription>
        <CardTitle className="text-3xl tracking-tight tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
