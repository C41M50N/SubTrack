import dayjs from "@/lib/dayjs";
import type { Subscription } from ".";

/**
 * Get all subscriptions that renewed or will renew in the given month period.
 * @param subscriptions - The list of subscriptions to filter.
 * @param month - The month to filter subscriptions by (0-11).
 * @param year - The year to filter subscriptions by.
 * @returns An array of subscription IDs that renew in the specified month and year.
 */
export function getSubscriptionsInMonth(subscriptions: Subscription[], month: number, year: number): string[] {
  const start = dayjs().set('month', month).set('year', year).startOf("month");
  const end = start.endOf("month");

  const subsWithAdjustedDates = subscriptions.map((sub) => {
    let pastInvoiceDate = dayjs(sub.next_invoice);
    while (!pastInvoiceDate.isBefore(start)) {
      pastInvoiceDate = step('bwd', pastInvoiceDate, sub.frequency)
    }
    return { ...sub, next_invoice: pastInvoiceDate.toDate() }
  })

  const result: string[] = [];
  for (const sub of subsWithAdjustedDates) {
    let curr = dayjs(sub.next_invoice);
    while (curr.isBefore(end)) {
      if (curr.month() === month && curr.year() === year) {
        result.push(sub.id);
        break;
      }
      curr = step('fwd', curr, sub.frequency);
    }
  }

  return result;
}

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
