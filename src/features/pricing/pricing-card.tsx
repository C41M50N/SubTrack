import { Button } from "@/components/ui/button";
import { IconCircleCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { PurchasableLicense } from ".";

type Props = {
	title: string;
	subtitle: string;
	cost: number;
	features: Array<string>;
	actionLabel: string;
} & (
	| {
			actionType: "navigate";
			href: string;
	  }
	| {
			actionType: "submit-checkout-form";
			userId: string;
			userEmail: string;
			licenseType: PurchasableLicense;
	  }
	| {
			actionType: "none";
	  }
);

export default function PricingCard(props: Props) {
	const router = useRouter();

	return (
		<div className="min-w-[200px] px-6 py-6 flex flex-col border-2 border-gray-200 rounded-lg shadow-lg">
			<div className="mx-auto text-center">
				<h4 className="mx-auto text-xl font-bold">{props.title}</h4>

				<div className="h-6" />

				<h3 className="text-5xl font-bold tabular-nums">${props.cost}</h3>

				<div className="h-2" />

				<span className="text-muted-foreground">{props.subtitle}</span>
			</div>

			<div className="mt-6 mb-8 flex flex-col gap-1.5">
				{props.features.map((feature) => (
					<div
						key={feature}
						className="flex flex-row gap-2 items-center text-sm"
					>
						<IconCircleCheck className="text-[#54617f] size-5" />
						<span className="leading-none text-muted-foreground">
							{feature}
						</span>
					</div>
				))}
			</div>

			<div className="flex-1" />

			{props.actionType === "none" && (
				<Button variant="ghost" className="w-full hover:cursor-default">
					{props.actionLabel}
				</Button>
			)}

			{props.actionType === "navigate" && (
				<Button className="w-full" onClick={() => router.push(props.href)}>
					{props.actionLabel}
				</Button>
			)}

			{props.actionType === "submit-checkout-form" && (
				<form action="/api/checkout" method="post">
					<input hidden name="userId" value={props.userId} />
					<input hidden name="email" value={props.userEmail} />
					<input hidden name="licenseType" value={props.licenseType} />
					<Button type="submit" className="w-full">
						{props.actionLabel}
					</Button>
				</form>
			)}
		</div>
	);
}
