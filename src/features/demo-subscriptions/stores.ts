import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DemoSubscription } from "./types";

type State = {
	subscriptions: Array<DemoSubscription>;
	addSubscription: (sub: Omit<DemoSubscription, "id">) => void;
	updateDemoSubscription: (sub: DemoSubscription) => void;
	removeSubscription: (sub_id: string) => void;
	setSubscriptions: (subs: Array<DemoSubscription>) => void;
	resetSubscriptions: () => void;
};

export const useDemoSubscriptions = create<State>()(
	persist(
		(set, get) => ({
			subscriptions: [
				{
					id: uuidv4(),
					name: "Spotify",
					amount: 4.99 * 100,
					frequency: "monthly",
					category: "entertainment",
					next_invoice: dayjs().add(3, "days").toDate(),
					icon_ref: "spotify",
					send_alert: false,
				},
				{
					id: uuidv4(),
					name: "Hulu",
					amount: 7.99 * 100,
					frequency: "monthly",
					category: "entertainment",
					next_invoice: dayjs().add(2, "days").toDate(),
					icon_ref: "hulu",
					send_alert: false,
				},
				{
					id: uuidv4(),
					name: "Apple Music",
					amount: 10.99 * 100,
					frequency: "monthly",
					category: "entertainment",
					next_invoice: dayjs().add(1, "days").toDate(),
					icon_ref: "apple-music",
					send_alert: false,
				},
				{
					id: uuidv4(),
					name: "Amazon Prime",
					amount: 139.0 * 100,
					frequency: "yearly",
					category: "miscellaneous",
					next_invoice: dayjs().add(4, "days").toDate(),
					icon_ref: "amazon",
					send_alert: false,
				},
				{
					id: uuidv4(),
					name: "Disney Plus",
					amount: 139.99 * 100,
					frequency: "yearly",
					category: "entertainment",
					next_invoice: dayjs().add(5, "days").toDate(),
					icon_ref: "disney-plus",
					send_alert: false,
				},
			],

			addSubscription(sub) {
				set({
					subscriptions: [...get().subscriptions, { ...sub, amount: sub.amount * 100, id: uuidv4() }],
				});
			},

			updateDemoSubscription(sub) {
				const idx = get().subscriptions.findIndex((s) => s.id === sub.id);
				set({
					subscriptions: [
						...get().subscriptions.slice(0, idx),
						{
							...sub,
							amount: sub.amount * 100
						},
						...get().subscriptions.slice(idx + 1),
					],
				});
			},

			removeSubscription(sub_id) {
				set({
					subscriptions: get().subscriptions.filter((sub) => sub.id !== sub_id),
				});
			},

			setSubscriptions(subs) {
				set({ subscriptions: subs });
			},

			resetSubscriptions() {
				set({ subscriptions: [] });
			},
		}),
		{
			name: "subscriptions-demo-db",
			storage: createJSONStorage(() => localStorage),
		},
	),
);

type UseSelectedDemoSubscriptionsState = {
	subscriptions: Array<DemoSubscription>;
	addSubscription: (sub: DemoSubscription) => void;
	removeSubscription: (sub_id: string) => void;
	setSubscriptions: (subs: Array<DemoSubscription>) => void;
	resetSubscriptions: () => void;
};

export const useSelectedDemoSubscriptions =
	create<UseSelectedDemoSubscriptionsState>()((set, get) => ({
		subscriptions: [],
		addSubscription: (sub: DemoSubscription) => {
			if (get().subscriptions) {
				set({ subscriptions: [...get().subscriptions, sub] });
			} else {
				set({ subscriptions: [sub] });
			}
		},
		removeSubscription: (sub_id: string) => {
			set({
				subscriptions: get().subscriptions.filter((sub) => sub.id !== sub_id),
			});
		},
		setSubscriptions: (subs: Array<DemoSubscription>) => {
			set({ subscriptions: subs });
		},
		resetSubscriptions: () => {
			set({ subscriptions: [] });
		},
	}));
