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
        new_next_invoice = current.add(7, "days");
        break;

      case "bi-weekly":
        new_next_invoice = current.add(7*2, "days");
        break;

      case "monthly":
        new_next_invoice = current.add(30, "days");
        break;

      case "bi-monthly":
        new_next_invoice = current.add(30*2, "days");
        break;

      case "yearly":
        new_next_invoice = current.add(365, "days");
        break;

      case "bi-yearly":
        new_next_invoice = current.add(365*2, "days");
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
