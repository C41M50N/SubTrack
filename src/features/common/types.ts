import { Subscription } from "../subscriptions/types";
import { DemoSubscription } from "../demo-subscriptions/types";

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

export type SubscriptionFrequency = typeof FREQUENCIES[number];
export type SubscriptionIcon = typeof ICONS[number];

export type StatisticItem = {
  description: string;
  getResult: (subscriptions: Array<Subscription | DemoSubscription>) => number;
}
