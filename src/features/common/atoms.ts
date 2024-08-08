import type { Collection } from "@prisma/client";
import { atom } from "jotai";
import type { Subscription } from "../subscriptions/types";

export const selectedSubscriptionsAtom = atom<Array<Subscription>>([]);

export const selectedCollectionIdAtom = atom<Collection["id"] | null>(null);