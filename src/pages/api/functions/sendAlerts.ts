import dayjs from 'dayjs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { notifications } from '@/features/notifications';
import type { Subscription } from '@/features/subscriptions';
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

  const renewingSoonSubscriptions = (await prisma.subscription.findMany({
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
  })) as Subscription[];

  const renewedRecentlySubscriptions = (await prisma.subscription.findMany({
    where: {
      last_invoice: {
        lte: now.subtract(1, 'month').endOf('month').toDate(),
        gte: now.subtract(1, 'month').startOf('month').toDate(),
      },
      send_alert: { equals: true },
    },
    orderBy: {
      last_invoice: 'desc',
    },
  })) as Subscription[];

  const groupRenewingSoonSubscriptions = groupBy(
    renewingSoonSubscriptions,
    (sub) => sub.user_id
  );
  const groupRenewedRecentlySubscriptions = groupBy(
    renewedRecentlySubscriptions,
    (sub) => sub.user_id
  );

  console.info(groupRenewedRecentlySubscriptions);
  console.info(groupRenewingSoonSubscriptions);

  const userIds = new Set([
    ...Object.keys(groupRenewingSoonSubscriptions),
    ...Object.keys(groupRenewedRecentlySubscriptions),
  ]);
  for (const userId of userIds) {
    const renewingSoonSubs = groupRenewingSoonSubscriptions[userId] ?? [];
    const renewedRecentlySubs = groupRenewedRecentlySubscriptions[userId] ?? [];

    if (renewingSoonSubs.length === 0 && renewedRecentlySubs.length === 0) {
      return;
    }

    await notifications.sendMonthlyReviewNotification(
      renewedRecentlySubs,
      renewingSoonSubs
    );

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true },
    });

    console.info(`Sent monthly review notification to ${JSON.stringify(user)}`);
  }

  return res.send({});
}
