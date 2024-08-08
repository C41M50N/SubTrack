import dayjs from "@/lib/dayjs";
import { toMoneyString } from "@/utils";
import type { Subscription } from "@prisma/client";
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Preview,
	Tailwind,
	Text,
} from "@react-email/components";
import React from "react";

type MonthlyReviewEmailProps = {
	user_name: string;
	renewing_soon: Subscription[] | undefined;
	renewed_recently: Subscription[] | undefined;
};

export function MonthlyReviewEmail({
	user_name = "Chuck Norris",
	renewing_soon,
	renewed_recently,
}: Readonly<MonthlyReviewEmailProps>) {
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
						{renewing_soon && (
							<>
								<Text className="text-2xl font-semibold">
									Subscriptions that are renewing soon
								</Text>
								<ul className="mt-1 gap-2">
									{renewing_soon.map((sub) => (
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

						{renewed_recently && (
							<>
								<Text className="text-2xl font-semibold">
									Subscriptions that have renewed recently
								</Text>
								<ul className="mt-1">
									{renewed_recently.map((sub) => {
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
