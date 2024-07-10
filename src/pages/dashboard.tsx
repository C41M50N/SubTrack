import React from "react"
import { api } from "@/utils/api";
import { StatisticItem } from "@/lib/types";
import { useSelectedSubscriptions } from "@/lib/stores";
import { getNextNMonths, toMoneyString } from "@/lib/utils";
import MainLayout from "@/layouts/main"
import { columns } from "@/components/subscriptions-table/columns";
import DataTable from "@/components/subscriptions-table/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import StatisticCard from "@/components/subscriptions/StatisticCard";
import SkeletonStatisticCard from "@/components/subscriptions/SkeletonStatisticCard";
import { getMonthCost } from "@/lib/helper";

const Statistics: Array<StatisticItem> = [
  {
    description: "cost per week",
    getResult: (subscriptions) => {
      let result = 0.0;
      for (let i = 0; i < subscriptions.length; i++) {
        const subscription = subscriptions[i]!;
        switch (subscription.frequency) {
          case "weekly":
            result += subscription.amount;
          break;
          
          case "bi-weekly":
            result += subscription.amount / 2.0;
          break;
            
          case "monthly":
            result += subscription.amount / 4.3;  // around 4.3 weeks in a month
          break;

          case "bi-monthly":
            result += subscription.amount / (4.3 * 2);
          break;

          case "yearly":
            result += subscription.amount / 52.0;  // around 52 weeks in a year
          break;

          case "bi-yearly":
            result += subscription.amount / (52.0 * 2);
          break;
        }
      }
      return result;
    }
  },
  {
    description: "cost per month",
    getResult: (subscriptions) => {
      let result = 0.0;
      for (let i = 0; i < subscriptions.length; i++) {
        const subscription = subscriptions[i]!;
        switch (subscription.frequency) {
          case "weekly":
            result += subscription.amount * 4.3;  // around 4.3 weeks in a month
          break;
          
          case "bi-weekly":
            result += subscription.amount * (4.3 / 2.0);
          break;
            
          case "monthly":
            result += subscription.amount;
          break;

          case "bi-monthly":
            result += subscription.amount / 2.0;
          break;

          case "yearly":
            result += subscription.amount / 12.0;  // 12 months in a year
          break;

          case "bi-yearly":
            result += subscription.amount / (12.0 * 2);
          break;
        }
      }
      return result;
    }
  },
  {
    description: "cost per year",
    getResult: (subscriptions) => {
      let result = 0.0;
      for (let i = 0; i < subscriptions.length; i++) {
        const subscription = subscriptions[i]!;
        switch (subscription.frequency) {
          case "weekly":
            result += subscription.amount * 52.0;   // around 52 weeks in a year
          break;
          
          case "bi-weekly":
            result += subscription.amount * (52.0 / 2.0);
          break;
            
          case "monthly":
            result += subscription.amount * 12.0;   // 12 months in a year
          break;

          case "bi-monthly":
            result += subscription.amount * (12.0 / 2.0);
          break;

          case "yearly":
            result += subscription.amount;
          break;

          case "bi-yearly":
            result += subscription.amount / 2.0;
          break;
        }
      }
      return result;
    }
  }
]


export default function DashboardPage() {
  const { data: subscriptions, isLoading: isSubsLoading } = api.main.getSubscriptions.useQuery();
  const { subscriptions: selectedSubscriptions } = useSelectedSubscriptions();

  return (
    <MainLayout title="Dashboard | SubTrack">
      <h1 className="text-2xl pt-4 pb-1">Dashboard</h1>
      <p className="text-muted-foreground">
        Track your subscriptions here.
      </p>
      <Separator className="mt-4 mb-6" />

      <div className="flex flex-row space-x-8">
        <div className="w-9/12">
          {isSubsLoading && (
            <div className="w-full space-y-2 p-2">
              <Skeleton className="h-12" />
              <div className="py-2 space-y-3">
                {[...Array(7)].map((v) => (
                  <Skeleton className="h-8" key={v} />
                ))}
              </div>
              <Skeleton className="h-12" />
            </div>
          )}
          {!isSubsLoading && !subscriptions && <span className="text-xl">No Subscriptions</span>}
          {!isSubsLoading && subscriptions && <DataTable columns={columns} data={subscriptions} />}
        </div>

        <div className="flex-1">
          <div className="flex flex-col space-y-4">

            {/* Statistic Cards */}
            {isSubsLoading && Statistics.map((_, idx) => (
              <SkeletonStatisticCard key={idx} />
            ))}
            {!isSubsLoading && subscriptions && Statistics.map((item, idx) => (
              <StatisticCard
                key={idx}
                description={item.description}
                value={item.getResult(selectedSubscriptions.length > 0 ? selectedSubscriptions : subscriptions)}
              />
            ))}

            {/* Monthly Cost Breakdown */}
            <Card>
              <Accordion type="single" collapsible defaultValue="monthly-cost-breakdown">
                <AccordionItem value="monthly-cost-breakdown">
                  <AccordionTrigger className="text-md font-semibold px-4 py-2">Monthly Cost Breakdown</AccordionTrigger>
                  {isSubsLoading && (
                    <AccordionContent>
                      {[...Array(12)].map((v) => (
                        <div key={v} className="w-full odd:bg-white even:bg-slate-50">
                          <Skeleton className="w-full" />
                        </div>
                      ))}
                    </AccordionContent>
                  )}
                  {!isSubsLoading && subscriptions && (
                    <AccordionContent>
                      {getNextNMonths(12).map(((data) => {
                        const [monthStr, month, year] = data
                        return (
                          <div key={`${monthStr}-${year}`} className="w-full odd:bg-white even:bg-slate-50">
                            <div className="px-4 py-1.5 flex flex-row">
                              <span className="flex-1">{`${monthStr} ${year}`}</span>
                              <span>{
                                toMoneyString(
                                  getMonthCost(
                                    selectedSubscriptions.length > 0 ? selectedSubscriptions : subscriptions,
                                    month,
                                    year
                                  )
                                )
                              }</span>
                            </div>
                          </div>
                        )
                      }))}
                    </AccordionContent>
                  )}
                </AccordionItem>
              </Accordion>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )  
}