'use client';

import { create } from 'zustand';

/**
 * Ephemeral client UI state: what the right-hand panel is showing.
 *
 * This is exactly what `src/stores/` is for. Server data never lives here —
 * that is TanStack Query's job. Losing this on reload is fine and expected.
 *
 * Selecting a library creature, a custom creature, and selecting a combatant
 * are all mutually exclusive: the panel shows one thing, so choosing any one
 * clears the other two rather than leaving multiple sources of truth about
 * what is on screen.
 */
type SelectionState = {
  selectedCreatureSlug: string | null;
  selectedCustomCreatureId: string | null;
  selectedCombatantId: string | null;
  selectCreature: (slug: string | null) => void;
  selectCustomCreature: (id: string | null) => void;
  selectCombatant: (id: string | null) => void;
};

export const useSelectionStore = create<SelectionState>(set => ({
  selectedCreatureSlug: null,
  selectedCustomCreatureId: null,
  selectedCombatantId: null,
  selectCreature: slug =>
    set({
      selectedCreatureSlug: slug,
      selectedCustomCreatureId: null,
      selectedCombatantId: null,
    }),
  selectCustomCreature: id =>
    set({
      selectedCustomCreatureId: id,
      selectedCreatureSlug: null,
      selectedCombatantId: null,
    }),
  selectCombatant: id =>
    set({
      selectedCombatantId: id,
      selectedCreatureSlug: null,
      selectedCustomCreatureId: null,
    }),
}));
