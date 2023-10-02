import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonStatisticCard() {
  return (
    <Card>
      <CardContent className="p-2 space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  )
}