import type { LicenseType } from "@prisma/client";

export type PurchasableLicense = Extract<LicenseType, "BASIC" | "PRO">;

type PricingTier = {
	title: string;
	cost: number;
	subtitle: string;
	features: Array<string>;
	href: string;
};

export const pricingInfo: Array<PricingTier> = [
	{
		cost: 0,
		title: "Free",
		subtitle: "completely free forever",
		features: ["1 collection", "up to 10 subscriptions per collection"],
		href: "/dashboard",
	},
	{
		cost: 10,
		title: "Basic",
		subtitle: "good enough for most people",
		features: [
			"up to 2 collections",
			"up to 50 subscriptions per collection",
			"advanced subscription table",
		],
		href: "/settings/license",
	},
	{
		cost: 25,
		title: "Pro",
		subtitle: "the best money can buy",
		features: [
			"up to 15 collections",
			"unlimited subscriptions per collection",
			"advanced subscription table",
			"integrations for cancel reminders",
		],
		href: "/settings/license",
	},
];

// biome-ignore lint/style/noNonNullAssertion: <explanation>
export const FREE_PRICING_INFO = pricingInfo.find(
	(info) => info.title === "Free",
)!;

// biome-ignore lint/style/noNonNullAssertion: <explanation>
export const BASIC_PRICING_INFO = pricingInfo.find(
	(info) => info.title === "Basic",
)!;

// biome-ignore lint/style/noNonNullAssertion: <explanation>
export const PRO_PRICING_INFO = pricingInfo.find(
	(info) => info.title === "Pro",
)!;

export const SUPER_FEATURES: Array<string> = [
	"unlimited subscriptions per collection",
	"unlimited collections",
	"integrations for cancel reminders",
];
