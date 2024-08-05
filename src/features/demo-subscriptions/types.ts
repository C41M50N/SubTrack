import { Subscription } from "@prisma/client";
import { SubscriptionFrequency, SubscriptionIcon } from "../common/types";

export const DEMO_CATEGORIES = [
	"entertainment",
	"health",
	"storage",
	"miscellaneous",
] as const;

export type DemoSubscription = Omit<Subscription, 'last_invoice' | 'userId' | 'collectionId'> & {
	frequency: SubscriptionFrequency;
	icon_ref: SubscriptionIcon;
	category: string;
}
