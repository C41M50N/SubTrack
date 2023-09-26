import React from "react"
import Head from "next/head"

import { Subscription } from "@/lib/types";
import MainLayout from "@/layouts/main"
import { columns, subscriptions } from "@/components/subscriptions-table/columns";
import { DataTable } from "@/components/subscriptions-table/table";
import { Separator } from "@/components/ui/separator";
import StatisticCard from "@/components/subscriptions/StatisticCard";

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
  const [selectedSubscriptions, setSelectedSubscriptions] = React.useState<Array<Subscription> | null>(null);

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
          <DataTable columns={columns} data={subscriptions} />
        </div>

        <div className="flex-1">
          <div className="flex flex-col space-y-4">
            {Statistics.map((item, idx) => (
              <StatisticCard 
                key={idx}
                description={item.description}
                value={item.getResult(selectedSubscriptions || subscriptions)}
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )  
}