import { atom } from "jotai";
import { Collection } from "@prisma/client";
import { Subscription } from "../subscriptions/types";

export const selectedSubscriptionsAtom = atom<Array<Subscription>>([]);

export const selectedCollectionIdAtom = atom<Collection['id'] | null>(null);
