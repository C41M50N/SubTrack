import dayjs from 'dayjs'
import { prisma } from "@/server/db";
import { Subscription } from "@/lib/types";
import { NextApiRequest, NextApiResponse } from 'next';

function updateInvoiceDate(current: dayjs.Dayjs, value: number, unit: dayjs.ManipulateType) {
  const NOW = dayjs();
  let newInvoiceDate = current.add(value, unit);

  // while in the past; increment by time frame
  while (newInvoiceDate.isBefore(NOW)) {
    newInvoiceDate = newInvoiceDate.add(value, unit);
  }

  return newInvoiceDate;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      next_invoice: { lte: new Date() }
    },
    select: {
      id: true,
      name: true,
      next_invoice: true,
      frequency: true,
      user: true
    }
  });

  subscriptions.forEach(async (sub) => {
    let new_next_invoice: dayjs.Dayjs
    const current = dayjs(sub.next_invoice)
    switch (sub.frequency as Subscription["frequency"]) {
      case "weekly":
        new_next_invoice = updateInvoiceDate(current, 1, "week");
        break;

      case "bi-weekly":
        new_next_invoice = updateInvoiceDate(current, 2, "week");
        break;

      case "monthly":
        new_next_invoice = updateInvoiceDate(current, 1, "month");
        break;

      case "bi-monthly":
        new_next_invoice = updateInvoiceDate(current, 2, "month");
        break;

      case "yearly":
        new_next_invoice = updateInvoiceDate(current, 1, "year");
        break;

      case "bi-yearly":
        new_next_invoice = updateInvoiceDate(current, 2, "year");
        break;

      default:
        break;
    }

    console.log(`updating 'next_invoice' on "${sub.name}" for ${sub.user.name} ...`)

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { next_invoice: new_next_invoice!.toDate(), last_invoice: current.toDate() }
    })
  })

  console.log(`Updated the 'next_invoice' field on ${subscriptions.length} subscriptions`)

  return res.send({})
}
