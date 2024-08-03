import { Collection } from "@prisma/client";
import { atom } from "jotai";

export const selectedCollectionIdAtom = atom<Collection['id'] | null>(null);
