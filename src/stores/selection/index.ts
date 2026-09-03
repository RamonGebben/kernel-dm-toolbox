'use client';

import { create } from 'zustand';

/**
 * Ephemeral client UI state: which row the right-hand panel is showing.
 *
 * This is exactly what `src/stores/` is for. Server data never lives here —
 * that is TanStack Query's job. Losing this on reload is fine and expected.
 */
type SelectionState = {
  selectedCreatureSlug: string | null;
  selectCreature: (slug: string | null) => void;
};

export const useSelectionStore = create<SelectionState>(set => ({
  selectedCreatureSlug: null,
  selectCreature: slug => set({ selectedCreatureSlug: slug }),
}));
