'use client';

import { create } from 'zustand';

/**
 * Ephemeral client UI state: which bastion the detail panel shows. Null means
 * "nothing picked yet" — the page then shows the first one
 * (`resolveSelectedBastionId`).
 */
type BastionSelectionState = {
  selectedBastionId: string | null;
  selectBastion: (id: string | null) => void;
};

export const useBastionSelectionStore = create<BastionSelectionState>(set => ({
  selectedBastionId: null,
  selectBastion: id => set({ selectedBastionId: id }),
}));
