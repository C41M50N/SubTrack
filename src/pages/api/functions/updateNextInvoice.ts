import type { NextApiRequest, NextApiResponse } from 'next';

import { getNextInvoiceDate } from '@/features/subscriptions/billing';
import type { SubscriptionFrequency } from '@/features/subscriptions/constants';
import dayjs from '@/lib/dayjs';
import { prisma } from '@/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false });
  }

  const subscriptions = await prisma.subscription.findMany({
    where: {
      next_invoice: { lte: new Date() },
    },
    select: {
      id: true,
      name: true,
      next_invoice: true,
      frequency: true,
      user: true,
    },
  });

  for (const sub of subscriptions) {
    const current = dayjs(sub.next_invoice);
    const new_next_invoice = getNextInvoiceDate(current, sub.frequency as SubscriptionFrequency, dayjs());

    console.info(`updating 'next_invoice' on "${sub.name}" for ${sub.user.name} ...`);

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        next_invoice: new_next_invoice.toDate(),
        last_invoice: current.toDate(),
      },
    });
  }

  console.info(`Updated the 'next_invoice' field on ${subscriptions.length} subscriptions`);

  return res.send({});
}
