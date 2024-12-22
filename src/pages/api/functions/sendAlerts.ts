import { sendReviewEmail } from "@/emails";
import { MonthlyReviewEmail } from "@/emails/monthly-review";
import { resend } from "@/lib/resend";
import { prisma } from "@/server/db";
import type { Subscription as SubscriptionDTO } from "@prisma/client";
import dayjs from "dayjs";
import type { NextApiRequest, NextApiResponse } from "next";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function groupBy<T>(arr: T[], fn: (item: T) => any) {
	return arr.reduce<Record<string, T[]>>((prev, curr) => {
		const groupKey = fn(curr);
		const group = prev[groupKey] || [];
		group.push(curr);
		// biome-ignore lint/performance/noAccumulatingSpread: <explanation>
		return { ...prev, [groupKey]: group };
	}, {});
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const authHeader = req.headers.authorization;
	if (
		!process.env.CRON_SECRET ||
		authHeader !== `Bearer ${process.env.CRON_SECRET}`
	) {
		return res.status(401).json({ success: false });
	}

	const renewingSoonSubscriptions = await prisma.subscription.findMany({
		where: {
			next_invoice: {
				lte: dayjs().add(32, "days").toDate(),
				gte: dayjs().toDate(),
			},
			send_alert: { equals: true },
		},
		orderBy: {
			next_invoice: "asc",
		},
	});

	const renewedRecentlySubscriptions = await prisma.subscription.findMany({
		where: {
			last_invoice: {
				lte: dayjs().toDate(),
				gte: dayjs().subtract(30, "days").toDate(),
			},
			send_alert: { equals: true },
		},
		orderBy: {
			last_invoice: "desc",
		},
	});

	const groupRenewingSoonSubscriptions = groupBy(
		renewingSoonSubscriptions,
		(sub: SubscriptionDTO) => sub.user_id,
	);
	const groupRenewedRecentlySubscriptions = groupBy(
		renewedRecentlySubscriptions,
		(sub: SubscriptionDTO) => sub.user_id,
	);

	console.log(groupRenewedRecentlySubscriptions);
	console.log(groupRenewingSoonSubscriptions);

	const userIds = new Set([
		...Object.keys(groupRenewingSoonSubscriptions),
		...Object.keys(groupRenewedRecentlySubscriptions),
	]);
	for (const userId of userIds) {
		const renewingSoonSubs = groupRenewingSoonSubscriptions[userId];
		const renewedRecentlySubs = groupRenewedRecentlySubscriptions[userId];
		const user = await prisma.user.findUniqueOrThrow({
			where: { id: userId },
			select: { name: true, email: true },
		});

		await sendReviewEmail({
			to: user.email,
			emailProps: {
				userName: user.name,
				renewingSoon: renewingSoonSubs ?? [],
				renewedRecently: renewedRecentlySubs ?? [],
			},
		});

		console.log(`Sent alert email to ${JSON.stringify(user)}`);
	}

	return res.send({});
}
