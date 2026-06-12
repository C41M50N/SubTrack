import SkeletonStatisticCard from '@/components/subscriptions/skeleton-statistic-card';
import StatisticCard from '@/components/subscriptions/statistic-card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Subscription } from '@/features/subscriptions';
import {
  getNextNMonths,
  getSubscriptionsInMonth,
} from '@/features/subscriptions/filters';
import { toMoneyString } from '@/features/subscriptions/money';
import { Statistics } from '@/features/subscriptions/stats';

type SubscriptionInsightsPanelProps = {
  isSubscriptionsLoading: boolean;
  subscriptions: Subscription[] | undefined;
  subscriptionsForInsights: Subscription[];
};

const MONTHLY_BREAKDOWN_MONTH_COUNT = 12;

export function SubscriptionInsightsPanel({
  isSubscriptionsLoading,
  subscriptions,
  subscriptionsForInsights,
}: SubscriptionInsightsPanelProps) {
  const loadingBreakdownKeys = getNextNMonths(
    MONTHLY_BREAKDOWN_MONTH_COUNT
  ).map((monthData) => monthData.format('MMMM-YYYY'));

  return (
    <div className="min-w-[245px]">
      <div className="flex flex-col gap-4">
        {isSubscriptionsLoading &&
          Statistics.map((item) => (
            <SkeletonStatisticCard key={item.description} />
          ))}

        {!isSubscriptionsLoading &&
          subscriptions &&
          Statistics.map((item) => (
            <StatisticCard
              description={item.description}
              key={item.description}
              value={item.getResult(subscriptionsForInsights)}
            />
          ))}

        <Card>
          <Accordion
            collapsible
            defaultValue="monthly-cost-breakdown"
            type="single"
          >
            <AccordionItem value="monthly-cost-breakdown">
              <AccordionTrigger className="px-4 py-2 font-semibold text-md">
                Monthly Cost Breakdown
              </AccordionTrigger>
              {isSubscriptionsLoading && (
                <AccordionContent>
                  {loadingBreakdownKeys.map((key) => (
                    <div
                      className="w-full border-t border-t-muted-foreground/20 even:bg-muted/65"
                      key={key}
                    >
                      <Skeleton className="w-full" />
                    </div>
                  ))}
                </AccordionContent>
              )}
              {!isSubscriptionsLoading && subscriptions && (
                <AccordionContent>
                  {getNextNMonths(MONTHLY_BREAKDOWN_MONTH_COUNT).map(
                    (monthData) => {
                      const monthStr = monthData.format('MMMM');
                      const month = monthData.month();
                      const year = monthData.year();
                      return (
                        <div
                          className="w-full border-t border-t-muted-foreground/20 even:bg-muted/65"
                          key={`${monthStr}-${year}`}
                        >
                          <div className="flex flex-row px-4 py-1.5">
                            <span className="flex-1">{`${monthStr} ${year}`}</span>
                            <span>
                              {toMoneyString(
                                getSubscriptionsInMonth(
                                  subscriptionsForInsights,
                                  month,
                                  year
                                ).reduce((acc, sub) => acc + sub.amount, 0)
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </AccordionContent>
              )}
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </div>
  );
}
