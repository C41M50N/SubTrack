import React from 'react';
import { create } from 'zustand';

type ModalStateValue = 'open' | 'closed';

export function useModalState() {
  const [state, setState] = React.useState<ModalStateValue>('closed');
  return { state, setState } as const;
}

export type ModalState = ReturnType<typeof useModalState>;

type CreateModalStateStoreParams = {
  defaultState?: ModalState['state'];
};

type ModalStateStoreState = {
  state: ModalState['state'];
  set: (state: ModalState['state']) => void;
};

export function createModalStateStore({ defaultState = 'closed' }: CreateModalStateStoreParams) {
  return create<ModalStateStoreState>((set) => ({
    state: defaultState,
    set(newState) {
      set(() => ({ state: newState }));
    },
  }));
}
