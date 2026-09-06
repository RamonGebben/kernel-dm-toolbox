'use client';

import { create } from 'zustand';

/**
 * Ephemeral client UI state: which dice expression the roll modal is
 * showing, and whether this particular roll may be applied to combatants
 * (only true for rolls triggered from creature text in the tracker, never
 * from spell text on `/spells`).
 */
type OpenDiceRollInput = {
  expression: string;
  count: number;
  sides: number;
  modifier: number;
  canApplyToCombatants: boolean;
};

type DiceRollState = {
  dice: (OpenDiceRollInput & { requestId: number }) | null;
  nextRequestId: number;
  openDiceRoll: (dice: OpenDiceRollInput) => void;
  closeDiceRoll: () => void;
};

/**
 * `requestId` increments on every open so a fresh roll — even of the exact
 * same expression re-clicked — remounts the modal's local stepper/result
 * state via a React `key`, instead of carrying over a stale count or result.
 */
export const useDiceRollStore = create<DiceRollState>(set => ({
  dice: null,
  nextRequestId: 0,
  openDiceRoll: dice =>
    set(state => ({
      dice: { ...dice, requestId: state.nextRequestId },
      nextRequestId: state.nextRequestId + 1,
    })),
  closeDiceRoll: () => set({ dice: null }),
}));
