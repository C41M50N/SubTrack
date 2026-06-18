import { Card, CardContent } from '@/components/ui/card';
import { toMoneyString } from '@/features/subscriptions/money';

type StatisticCardProps = {
  value: number;
  description: string;
};

export default function StatisticCard({
  value,
  description,
}: StatisticCardProps) {
  return (
    <Card className="bg-card shadow-xs">
      <CardContent className="py-2">
        <div className="font-bold text-2xl">≈ {toMoneyString(value)}</div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
