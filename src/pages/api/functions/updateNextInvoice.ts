import dayjs from 'dayjs'
import { prisma } from "@/server/db";
import { Subscription } from "@/lib/types";

export default async function handler() {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      next_invoice: { lte: new Date() }
    }
  });

  subscriptions.forEach(async (sub) => {
    let new_next_invoice: dayjs.Dayjs
    const current = dayjs(sub.next_invoice)
    switch (sub.frequency as Subscription["frequency"]) {
      case "weekly":
        new_next_invoice = current.add(1, "week");
        break;

      case "bi-weekly":
        new_next_invoice = current.add(2, "week");
        break;

      case "monthly":
        new_next_invoice = current.add(1, "month");
        break;

      case "bi-monthly":
        new_next_invoice = current.add(2, "month");
        break;

      case "yearly":
        new_next_invoice = current.add(1, "year");
        break;

      case "bi-yearly":
        new_next_invoice = current.add(2, "year");
        break;

      default:
        break;
    }

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { next_invoice: new_next_invoice!.toDate() }
    })
  })

  console.log(`Updated the 'next_invoice' field on ${subscriptions.length} subscriptions`)
}
