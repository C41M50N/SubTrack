import { StatisticItem } from "./types";

export const Statistics: Array<StatisticItem> = [
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
