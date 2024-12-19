import { createModalStateStore } from "@/lib/hooks";

export const useNewSubscriptionModal = createModalStateStore({ defaultState: "closed" })
