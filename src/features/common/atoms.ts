import type { Collection } from '@prisma/client';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { atom } from 'jotai';

export const selectedCollectionIdAtom = atom<Collection['id'] | null>(null);

export const tableSizeAtom = atomWithStorage<'default' | 'compact'>(
  'table-size',
  'default',
  createJSONStorage(),
  { getOnInit: true }
);
