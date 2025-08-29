import type { Dayjs } from "dayjs";
import dayjs from "@/lib/dayjs";
import type { Subscription } from ".";

/**
 * Get an array of the next N months from the current month.
 * @param n - The number of months to get.
 * @returns An array of dayjs objects representing the next N months.
 */
export function getNextNMonths(n: number): Dayjs[] {
  const res: Array<dayjs.Dayjs> = [];
  for (let offset = 0; offset < n; offset++) {
    const day = dayjs().add(1 + offset, "month");
    res.push(day);
  }
  return res;
}

/**
 * Get all subscriptions that renewed or will renew in the given month period.
 * @param subscriptions - The list of subscriptions to filter.
 * @param month - The month to filter subscriptions by (0-11).
 * @param year - The year to filter subscriptions by.
 * @returns An array of subscription IDs that renew in the specified month and year.
 */
export function getSubscriptionsInMonth(subscriptions: Subscription[], month: number, year: number): Subscription[] {
  const start = dayjs().set('month', month).set('year', year).startOf("month");
  const end = start.endOf("month");

  const subsWithAdjustedDates = subscriptions.map((sub) => {
    let pastInvoiceDate = dayjs(sub.next_invoice);
    while (!pastInvoiceDate.isBefore(start)) {
      pastInvoiceDate = step('bwd', pastInvoiceDate, sub.frequency)
    }
    return { ...sub, next_invoice: pastInvoiceDate.toDate() }
  })

  const result: Subscription[] = [];
  for (const sub of subsWithAdjustedDates) {
    let curr = dayjs(sub.next_invoice);
    while (curr.isBefore(end)) {
      if (curr.month() === month && curr.year() === year) {
        result.push(sub);
        break;
      }
      curr = step('fwd', curr, sub.frequency);
    }
  }

  return result;
}

/**
 * Get the next invoice date based on the subscription frequency.
 * @param dir - The direction to step (forward or backward).
 * @param curr - The current date to step from.
 * @param frequency - The frequency of the subscription.
 * @returns The next or previous invoice date.
 */
export function step(
  dir: 'fwd' | 'bwd',
  curr: dayjs.Dayjs,
  frequency: Subscription["frequency"],
): dayjs.Dayjs {
  const frequencyMap: Record<Subscription["frequency"], [number, dayjs.ManipulateType]> = {
    "weekly": [1, "week"],
    "bi-weekly": [2, "week"],
    "monthly": [1, "month"],
    "bi-monthly": [2, "month"],
    "yearly": [1, "year"],
    "bi-yearly": [2, "year"],
  };

  const [stepAmount, stepUnit] = frequencyMap[frequency];

  if (dir === 'fwd') {
    return curr.add(stepAmount, stepUnit);
  }
  return curr.subtract(stepAmount, stepUnit);
}

export function frequencyToDisplayText(frequency: Subscription["frequency"]): string {
  const displayMap: Record<Subscription["frequency"], string> = {
    "weekly": "week",
    "bi-weekly": "2 weeks", 
    "monthly": "month",
    "bi-monthly": "2 months",
    "yearly": "year",
    "bi-yearly": "2 years",
  };

  return displayMap[frequency];
}
