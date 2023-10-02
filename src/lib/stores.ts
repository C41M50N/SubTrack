import { create } from "zustand"
import { Subscription } from "@/lib/types"

type UseSelectedSubscriptionsState = {
  subscriptions: Array<Subscription> | null
  setSubscriptions: (subs: Array<Subscription>) => void
  resetSubscriptions: () => void
}

export const useSelectedSubscriptions = create<UseSelectedSubscriptionsState>()((set, get) => ({
  subscriptions: null,
  setSubscriptions: (subs: Array<Subscription>) => {
    set({ subscriptions: subs })
  },
  resetSubscriptions: () => {
    set({ subscriptions: null })
  }
}))
