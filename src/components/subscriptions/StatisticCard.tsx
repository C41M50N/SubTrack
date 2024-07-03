import { Card, CardContent } from "@/components/ui/card"
import { toMoneyString } from "@/lib/utils"

type StatisticCardProps = {
  value: number
  description: string
}

export default function StatisticCard({ value, description }: StatisticCardProps) {
  return (
    <Card className="bg-[#d6e7ff]/30 border border-gray-400">
      <CardContent className="py-2">
        <div className="text-2xl font-bold">
          ≈ {toMoneyString(value)}
        </div>

        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}