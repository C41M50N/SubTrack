import { Card, CardContent } from '@/components/ui/card';
import { toMoneyString } from '@/utils';

type StatisticCardProps = {
  value: number;
  description: string;
};

export default function StatisticCard({
  value,
  description,
}: StatisticCardProps) {
  return (
    <Card className="bg-card shadow-sm">
      <CardContent className="py-2">
        <div className="font-bold text-2xl">≈ {toMoneyString(value)}</div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
