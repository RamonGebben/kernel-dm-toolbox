'use client';

import { create } from 'zustand';

/** Ephemeral client UI state: which scenario the simulator's build view
 * is showing. Mirrors `useSpellSelectionStore`'s shape — its own store
 * because scenario selection has nothing to do with the tracker's or the
 * spell lookup's own selection concerns. */
type ScenarioSelectionState = {
  selectedScenarioId: string | null;
  selectScenario: (id: string | null) => void;
};

export const useScenarioSelectionStore = create<ScenarioSelectionState>(
  set => ({
    selectedScenarioId: null,
    selectScenario: id => set({ selectedScenarioId: id }),
  }),
);
