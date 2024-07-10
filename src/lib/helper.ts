import dayjs from "dayjs";
import { Subscription } from "./types";

export function stepByFrequency(d: dayjs.Dayjs, frequency: Subscription["frequency"]): dayjs.Dayjs {
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