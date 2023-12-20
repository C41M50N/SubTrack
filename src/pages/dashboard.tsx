import React from "react"
import Head from "next/head"

import { api } from "@/utils/api";
import { Subscription } from "@/lib/types";
import { getNextNMonths, toMoneyString } from "@/lib/utils";
import { useSelectedSubscriptions } from "@/lib/stores";
import MainLayout from "@/layouts/main"
import { columns } from "@/components/subscriptions-table/columns";
import { DataTable } from "@/components/subscriptions-table/table";
import { Separator } from "@/components/ui/separator";
import StatisticCard from "@/components/subscriptions/StatisticCard";
import SkeletonStatisticCard from "@/components/subscriptions/SkeletonStatisticCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type StatisticItem = {
  description: string
  getResult: (subscriptions: Array<Subscription>) => number
}

const Statistics: Array<StatisticItem> = [
  {
    description: "cost per week",
    getResult: (subscriptions: Array<Subscription>) => {
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
    getResult: (subscriptions: Array<Subscription>) => {
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
    getResult: (subscriptions: Array<Subscription>) => {
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
    <MainLayout>
      <Head>
        <title>Dashboard | SubTrack</title>
      </Head>

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
                {[...Array(7)].map((v, idx) => (
                  <Skeleton className="h-8" key={idx} />
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

            <Card>
              <Accordion type="single" className="px-4">
                <AccordionItem value="monthly-cost-breakdown">
                  <AccordionTrigger className="text-md font-semibold py-2">Monthly Cost Breakdown</AccordionTrigger>
                  <AccordionContent>
                    {getNextNMonths(10).map(((data) => {
                      const [month, year] = data
                      return (
                        <div key={`${month}-${year}`} className="p-2 flex flex-row">
                          <span className="flex-1">{`${month} ${year}`}</span>
                          <span>{toMoneyString(0.00)}</span>
                        </div>
                      )
                    }))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )  
}