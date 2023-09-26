
export const FREQUENCIES = ["weekly", "bi-weekly", "monthly", "bi-monthly", "yearly", "bi-yearly"] as const
export const CATEGORIES = ["entertainment", "health", "finance", "productivity"] as const
export const ICONS = ["todoist", "spotify", "google-one", "amazon", "proton", "obsidian"] as const


export type Subscription = {
	id: string
	name: string
	amount: number
	frequency: typeof FREQUENCIES[number]
	category: typeof CATEGORIES[number] | string
	next_invoice: Date,
	icon?: typeof ICONS[number]
}
