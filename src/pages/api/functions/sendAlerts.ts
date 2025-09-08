import type { Subscription as SubscriptionDTO } from '@prisma/client';
import dayjs from 'dayjs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { notifications } from '@/features/notifications';
import { groupBy } from '@/features/subscriptions/utils';
import { prisma } from '@/server/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return res.status(401).json({ success: false });
  }

  const now = dayjs();

  const renewingSoonSubscriptions = await prisma.subscription.findMany({
    where: {
      next_invoice: {
        lte: now.endOf('month').toDate(),
        gte: now.startOf('month').toDate(),
      },
      send_alert: { equals: true },
    },
    orderBy: {
      next_invoice: 'asc',
    },
  });

  const renewedRecentlySubscriptions = await prisma.subscription.findMany({
    where: {
      last_invoice: {
        lte: now.subtract(1, 'month').startOf('month').toDate(),
        gte: now.subtract(1, 'month').endOf('month').toDate(),
      },
      send_alert: { equals: true },
    },
    orderBy: {
      last_invoice: 'desc',
    },
  });

  const groupRenewingSoonSubscriptions = groupBy(
    renewingSoonSubscriptions,
    (sub: SubscriptionDTO) => sub.user_id
  );
  const groupRenewedRecentlySubscriptions = groupBy(
    renewedRecentlySubscriptions,
    (sub: SubscriptionDTO) => sub.user_id
  );

  console.info(groupRenewedRecentlySubscriptions);
  console.info(groupRenewingSoonSubscriptions);

  const userIds = new Set([
    ...Object.keys(groupRenewingSoonSubscriptions),
    ...Object.keys(groupRenewedRecentlySubscriptions),
  ]);
  for (const userId of userIds) {
    // const renewingSoonSubs = groupRenewingSoonSubscriptions[userId]?.sort(
    //   (a, b) => a.next_invoice.getTime() - b.next_invoice.getTime()
    // );
    // const renewedRecentlySubs = groupRenewedRecentlySubscriptions[userId]?.sort(
    //   // biome-ignore lint/style/noNonNullAssertion: <explanation>
    //   (a, b) => b.last_invoice!.getTime() - a.last_invoice!.getTime()
    // );

    const renewingSoonSubs = groupRenewingSoonSubscriptions[userId];
    const renewedRecentlySubs = groupRenewedRecentlySubscriptions[userId];

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true },
    });

    await notifications.sendMonthlyReviewNotification(
      renewedRecentlySubs ?? [],
      renewingSoonSubs ?? []
    );

    console.info(`Sent monthly review notification to ${JSON.stringify(user)}`);
  }

  return res.send({});
}
