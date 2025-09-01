import type { Collection } from '@prisma/client';
import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import type { Subscription } from '../subscriptions';

export const selectedSubscriptionsAtom = atom<Subscription[]>([]);

export const selectedCollectionIdAtom = atom<Collection['id'] | null>(null);

export const tableSizeAtom = atomWithStorage<'default' | 'compact'>(
  'table-size',
  'default',
  createJSONStorage(),
  { getOnInit: true }
);
