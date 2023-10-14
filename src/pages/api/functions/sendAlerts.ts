import dayjs from 'dayjs'
import _ from 'lodash'
import { prisma } from "@/server/db"
import { Subscription as SubscriptionDTO } from "@prisma/client"
import { resend } from '@/lib/resend'
import RenewalAlertEmail from '@/emails/RenewalAlert'

function groupBy<T>(arr: T[], fn: (item: T) => any) {
  return arr.reduce<Record<string, T[]>>((prev, curr) => {
      const groupKey = fn(curr);
      const group = prev[groupKey] || [];
      group.push(curr);
      return { ...prev, [groupKey]: group };
  }, {});
}

export default async function handler() {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      next_invoice: { lte: dayjs().add(32, "days").toDate() }, // within the next 32 days
      send_alert: { equals: true }
    }
  })

  const groupSubscriptions = groupBy(subscriptions, (sub: SubscriptionDTO) => sub.userId);

  for (const userId in groupSubscriptions) {
    const subs = groupSubscriptions[userId]!;
    const user_info = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true } })

    if (user_info.email && user_info.name) {
      resend.sendEmail({
        from: '...@subtrack.com',
        to: user_info.email,
        subject: `SubTrack: Upcoming Subscription Renewals`,
        react: RenewalAlertEmail({
          user_name: user_info.name,
          subscriptions: subs.map((s) => ({ id: s.id, title: s.name, renewal_date: dayjs(s.next_invoice).format("dddd, MMM D") }))
        })
      })
    }
  }

}
