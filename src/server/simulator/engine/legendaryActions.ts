import {
  selectAction,
  type ActionChoice,
} from '~/server/simulator/engine/selectAction';
import type { EngineCombatant } from '~/server/simulator/engine/types';

export type LegendaryActionSpend = { choice: ActionChoice; cost: number };

/**
 * Picks the most expensive `LEGENDARY_ACTION` `self` can currently afford
 * and use against a living enemy — spent between other combatants' turns,
 * per 5e's own legendary-action timing, rather than on `self`'s own turn.
 * Reuses `selectAction`'s targeting so a legendary attack/AoE picks a
 * target the same way a normal turn would; the affordability/availability
 * filtering happens here since `selectAction` itself is turn-agnostic.
 */
export const spendLegendaryAction = (
  self: EngineCombatant,
  enemies: readonly EngineCombatant[],
  availableActionIds: ReadonlySet<string>,
): LegendaryActionSpend | null => {
  if (self.currentHitPoints <= 0) return null;
  if (self.legendaryActionPoints <= 0) return null;

  const affordable = self.actions
    .filter(
      action =>
        action.actionType === 'LEGENDARY_ACTION' &&
        availableActionIds.has(action.id) &&
        (action.legendaryActionCost ?? 1) <= self.legendaryActionPoints,
    )
    .sort(
      (a, b) => (b.legendaryActionCost ?? 1) - (a.legendaryActionCost ?? 1),
    );

  for (const action of affordable) {
    const choice = selectAction(self, enemies, new Set([action.id]));
    if (choice) return { choice, cost: action.legendaryActionCost ?? 1 };
  }

  return null;
};
