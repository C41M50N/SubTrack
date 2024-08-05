import dayjs from "dayjs"
import { SubscriptionFrequency } from "./types"
import { Subscription } from "../subscriptions/types"

type Month = 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 'July' | 'August' | 'September' | 'October' | 'November' | 'December'
type Year = number
export function getNextNMonths(n: number) {
  const res: Array<[Month, number, Year]> = []
  for (let offset = 0; offset < n; offset++) {
    const day = dayjs().add(1 + offset, 'month')
    res.push([day.format('MMMM') as Month, day.month(), day.year()])
  }
  return res;
}

function stepByFrequency(d: dayjs.Dayjs, frequency: SubscriptionFrequency): dayjs.Dayjs {
  let res: [number, dayjs.ManipulateType] = [1, "week"];
  switch (frequency) {
    case "weekly":
      res = [1, "week"]
      break;

    case "bi-weekly":
      res = [2, "week"]
      break;

    case "monthly":
      res = [1, "month"]
      break;

    case "bi-monthly":
      res = [2, "month"]
      break;

    case "yearly":
      res = [1, "year"]
      break;

    case "bi-yearly":
      res = [2, "year"]
  
    default:
      break;
  }

  return d.add(res[0], res[1]);
}

export function getMonthCost(subs: Array<Subscription>, month: number, year: number) {
  let amount = 0.0;

  subs.forEach((sub) => {
    let invoiceDate = dayjs(sub.next_invoice);
    while (invoiceDate.isBefore(dayjs().set('month', month).set('year', year).endOf('month'))) {
      if (invoiceDate.month() === month && invoiceDate.year() === year) {
        amount += sub.amount;
      }
      invoiceDate = stepByFrequency(invoiceDate, sub.frequency)
    }
  })

  return amount;
}
