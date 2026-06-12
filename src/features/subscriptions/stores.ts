import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { createModalStateStore } from '@/lib/hooks';

export const tableSizeAtom = atomWithStorage<'default' | 'compact'>(
  'table-size',
  'default',
  createJSONStorage(),
  { getOnInit: true }
);

export const useNewSubscriptionModal = createModalStateStore({
  defaultState: 'closed',
});

export const useManageCategoriesModalState = createModalStateStore({
  defaultState: 'closed',
});

export const useExportDataModalState = createModalStateStore({
  defaultState: 'closed',
});

export const useImportDataModalState = createModalStateStore({
  defaultState: 'closed',
});

export const useDownloadCSVModalState = createModalStateStore({
  defaultState: 'closed',
});
