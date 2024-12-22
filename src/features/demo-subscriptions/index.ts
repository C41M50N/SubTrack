import type { Subscription } from "@prisma/client";
import type { SubscriptionFrequency, SubscriptionIcon } from "../common";
import { SubscriptionSchema } from "../subscriptions";

export const DEMO_CATEGORIES = [
	"entertainment",
	"health",
	"storage",
	"miscellaneous",
] as const;

export type DemoSubscription = Omit<
	Subscription,
	"last_invoice" | "user_id" | "collection_id"
> & {
	frequency: SubscriptionFrequency;
	icon_ref: SubscriptionIcon;
	category: string;
};

export const CreateDemoSubscriptionSchema = SubscriptionSchema.omit({
	id: true,
	collection_id: true,
});
