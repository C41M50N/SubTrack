import type { Subscription } from "@prisma/client";
import type { SubscriptionFrequency, SubscriptionIcon } from "../common/types";
import { SubscriptionSchema } from "../subscriptions/types";

export const DEMO_CATEGORIES = [
	"entertainment",
	"health",
	"storage",
	"miscellaneous",
] as const;

export type DemoSubscription = Omit<
	Subscription,
	"last_invoice" | "userId" | "collectionId"
> & {
	frequency: SubscriptionFrequency;
	icon_ref: SubscriptionIcon;
	category: string;
};

export const CreateDemoSubscriptionSchema = SubscriptionSchema.omit({
	id: true,
	collectionId: true,
});
