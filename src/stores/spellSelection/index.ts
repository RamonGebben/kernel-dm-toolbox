'use client';

import { create } from 'zustand';

/**
 * Ephemeral client UI state: which spell the lookup pane is showing.
 *
 * Kept separate from `useSelectionStore` — that store's mutual exclusion
 * between a browsed creature and a combatant is about the initiative
 * tracker's single right-hand panel, a concern the spell lookup pane, which
 * lives on its own route, does not share.
 */
type SpellSelectionState = {
  selectedSpellSlug: string | null;
  selectSpell: (slug: string | null) => void;
};

export const useSpellSelectionStore = create<SpellSelectionState>(set => ({
  selectedSpellSlug: null,
  selectSpell: slug => set({ selectedSpellSlug: slug }),
}));
