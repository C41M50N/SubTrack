import dayjs from "@/lib/dayjs";
import { toMoneyString } from "@/utils";
import type { Subscription } from "@prisma/client";
import {
	Body,
	Container,
	Head,
	Html,
	Img,
	Preview,
	Tailwind,
	Text
} from "@react-email/components";

export type MonthlyReviewEmailProps = {
	userName: string;
	renewingSoon: Subscription[];
	renewedRecently: Subscription[];
};

export function MonthlyReviewEmail({
	userName: user_name = "Chuck Norris",
	renewingSoon,
	renewedRecently,
}: Readonly<MonthlyReviewEmailProps>) {

	// sort asc
	const renewingSoonSubs = renewingSoon.sort(
		(a, b) => a.next_invoice.getTime() - b.next_invoice.getTime()
	);

	// sort desc
	const renewedRecentlySubs = renewedRecently.sort(
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		(a, b) => b.last_invoice!.getTime() - a.last_invoice!.getTime()
	)

	return (
		<Html>
			<Head />
			<Preview>Monthly Subscriptions Review</Preview>
			<Tailwind>
				<Body className="bg-white my-auto mx-auto font-sans">
					<Container className="mx-auto px-4 pt-5">
						<Img
							src="https://subtrack.cbuff.dev/subtrack_full.jpg"
							alt="SubTrack"
							height={30}
							width={135}
						/>
						<Text className="text-3xl font-bold">Subscriptions Review</Text>
						<Text className="text-sm text-muted-foreground">
							Hey {user_name}! Here is your subscriptions review for{" "}
							{dayjs().format("MMMM")}.
						</Text>
						{renewingSoonSubs.length > 0 && (
							<>
								<Text className="text-2xl font-semibold">
									Subscriptions that are renewing soon
								</Text>
								<ul className="mt-1 gap-2">
									{renewingSoonSubs.map((sub) => (
										<li key={sub.id}>
											<Text className="text-base">
												{sub.name} renewing on{" "}
												{dayjs(sub.next_invoice).format("MMM D")} (
												{toMoneyString(sub.amount)} {sub.frequency})
											</Text>
										</li>
									))}
								</ul>
								<div className="h-6" />
							</>
						)}

						{renewedRecentlySubs.length > 0 && (
							<>
								<Text className="text-2xl font-semibold">
									Subscriptions that have renewed recently
								</Text>
								<ul className="mt-1">
									{renewedRecentlySubs.map((sub) => {
										if (!sub.last_invoice) {
											throw new Error("invalid recently renewed subscription");
										}
										return (
											<li key={sub.id}>
												<Text className="text-base">
													{sub.name} renewed on{" "}
													{dayjs(sub.last_invoice).format("MMM D")} (
													{toMoneyString(sub.amount)} {sub.frequency})
												</Text>
											</li>
										);
									})}
								</ul>
							</>
						)}
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
