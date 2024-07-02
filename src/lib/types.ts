import { z } from "zod"
import { Subscription as SubscriptionDTO } from "@prisma/client"

// export const CATEGORIES = ["entertainment", "health", "finance", "productivity"] as const
export const FREQUENCIES = [
	"weekly", 
	"bi-weekly", 
	"monthly", 
	"bi-monthly", 
	"yearly", 
	"bi-yearly"
] as const;

export const ICONS = [
	"default", 
	// companies
	"amazon", "apple", "google", "youtube-music", "pandora.webp", 
	// music
	"spotify", "apple-music", "tidal", 
	// streaming services
	"amazon-prime-video", "hulu", "netflix", "disney-plus", "apple-tv", "hbo-max", "paramount-plus.webp", "fubo.jpg", "crunchyroll", "espn-plus.jpg", 
	// tools
	"todoist", "obsidian", "workona.jpeg", "proton", "termius", "dropbox", "google-drive", "evernote", 
	// miscellaneous
	"google-one", "audible.jpg", "masterclass", "brilliant", "kindle-unlimited", "coursera.png"
] as const;

export type Subscription = SubscriptionDTO & {
	frequency: typeof FREQUENCIES[number]
	icon_ref: typeof ICONS[number]
}

export const DEMO_CATEGORIES = [
	"entertainment",
	"health",
	"storage",
	"miscellaneous"
] as const;

// export type DemoCategory = typeof DEMO_CATEGORIES[number];

export type DemoSubscription = Omit<SubscriptionDTO, 'last_invoice' | 'userId'> & {
	frequency: typeof FREQUENCIES[number]
	icon_ref: typeof ICONS[number]
	category: string
}

export const SubscriptionSchema = z.object({
  name: z.string()
          .min(2, { message: "Name must be at least 2 characters" })
          .max(30, { message: "Name must be at most 30 characters" }),
  amount: z.coerce.number()
            .multipleOf(0.01)
            .min(0.01, { message: "Amount must be at least $0.01" })
            .max(100_000.00, { message: "Amount must be at most $100,000.00" }),
  frequency: z.enum(FREQUENCIES),
  category: z.string(),
  icon_ref: z.enum(ICONS),
  next_invoice: z.date(),
  send_alert: z.boolean()
})

export const SubscriptionSchemaWithId = SubscriptionSchema.merge(z.object({
	id: z.string()
}))

export type StatisticItem = {
  description: string
  getResult: (subscriptions: Array<Subscription | DemoSubscription>) => number
}
