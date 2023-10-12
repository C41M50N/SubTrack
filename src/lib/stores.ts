import { create } from "zustand"
import { Subscription } from "@/lib/types"

type UseSelectedSubscriptionsState = {
  subscriptions: Array<Subscription>
  addSubscription: (sub: Subscription) => void
  removeSubscription: (sub_id: string) => void
  setSubscriptions: (subs: Array<Subscription>) => void
  resetSubscriptions: () => void
}

export const useSelectedSubscriptions = create<UseSelectedSubscriptionsState>()((set, get) => ({
  subscriptions: [],
  addSubscription: (sub: Subscription) => {
    if (get().subscriptions) {
      set({ subscriptions: [...get().subscriptions, sub] })
    } else {
      set({ subscriptions: [sub] })
    }
  },
  removeSubscription: (sub_id: string) => {
    set({ subscriptions: get().subscriptions.filter((sub) => sub.id !== sub_id) })
  },
  setSubscriptions: (subs: Array<Subscription>) => {
    set({ subscriptions: subs })
  },
  resetSubscriptions: () => {
    set({ subscriptions: [] })
  }
}))
