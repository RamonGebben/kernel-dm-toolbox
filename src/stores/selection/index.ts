'use client';

import { create } from 'zustand';

/**
 * Ephemeral client UI state: what the right-hand panel is showing.
 *
 * This is exactly what `src/stores/` is for. Server data never lives here —
 * that is TanStack Query's job. Losing this on reload is fine and expected.
 *
 * Selecting a creature and selecting a combatant are mutually exclusive: the
 * panel shows one thing, so choosing either clears the other rather than
 * leaving two sources of truth about what is on screen.
 */
type SelectionState = {
  selectedCreatureSlug: string | null;
  selectedCombatantId: string | null;
  selectCreature: (slug: string | null) => void;
  selectCombatant: (id: string | null) => void;
};

export const useSelectionStore = create<SelectionState>(set => ({
  selectedCreatureSlug: null,
  selectedCombatantId: null,
  selectCreature: slug =>
    set({ selectedCreatureSlug: slug, selectedCombatantId: null }),
  selectCombatant: id =>
    set({ selectedCombatantId: id, selectedCreatureSlug: null }),
}));
