import dayjs from 'dayjs'
import { prisma } from "@/server/db"
import { Subscription as SubscriptionDTO } from "@prisma/client"
import { resend } from '@/lib/resend'
import { MonthlyReviewEmail } from '@/emails/monthly-review'
import { NextApiRequest, NextApiResponse } from 'next'

function groupBy<T>(arr: T[], fn: (item: T) => any) {
  return arr.reduce<Record<string, T[]>>((prev, curr) => {
      const groupKey = fn(curr);
      const group = prev[groupKey] || [];
      group.push(curr);
      return { ...prev, [groupKey]: group };
  }, {});
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const renewingSoonSubscriptions = await prisma.subscription.findMany({ where: {
    next_invoice: { lte: dayjs().add(32, 'days').toDate(), gte: dayjs().toDate() },
    send_alert: { equals: true }
  }});

  const renewedRecentlySubscriptions = await prisma.subscription.findMany({ where: {
    last_invoice: { lte: dayjs().toDate(), gte: dayjs().subtract(30, 'days').toDate() },
    send_alert: { equals: true }
  }});

  const groupRenewingSoonSubscriptions = groupBy(renewingSoonSubscriptions, (sub: SubscriptionDTO) => sub.userId);
  const groupRenewedRecentlySubscriptions = groupBy(renewedRecentlySubscriptions, (sub: SubscriptionDTO) => sub.userId);

  console.log(groupRenewedRecentlySubscriptions);
  console.log(groupRenewingSoonSubscriptions);

  const userIds = new Set([...Object.keys(groupRenewingSoonSubscriptions), ...Object.keys(groupRenewedRecentlySubscriptions)]);
  for (const userId of userIds) {
    const renewingSoonSubs = groupRenewingSoonSubscriptions[userId];
    const renewedRecentlySubs = groupRenewedRecentlySubscriptions[userId];
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true } });

    await resend.sendEmail({
      from: 'alert@subtrack.cbuff.dev',
      to: user.email,
      subject: `${dayjs().subtract(1, 'month').format('MMMM')} Subscriptions Review`,
      react: MonthlyReviewEmail({
        user_name: user.name,
        renewing_soon: renewingSoonSubs,
        renewed_recently: renewedRecentlySubs
      })
    })

    console.log(`Sent alert email to ${JSON.stringify(user)}`);
  }

  return res.send({})
}
