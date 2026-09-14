import type { TurnLogEntry } from '~/server/simulator/engine/types';

/**
 * Which combatant ids the battle canvas should briefly ring-highlight for
 * one turn-log entry — the actor and whoever it affected. Pure, colocated,
 * and used by `BattleViewerView` to highlight only the most recently
 * revealed entry rather than every entry seen so far.
 */
export const highlightedCombatantIdsForEntry = (
  entry: TurnLogEntry | null,
): string[] => {
  if (!entry) return [];

  switch (entry.kind) {
    case 'move':
    case 'defeated':
    case 'no-action':
    case 'condition-removed':
    case 'concentration-check':
    case 'down':
    case 'death-save':
    case 'stabilized':
    case 'revived':
      return [entry.combatantId];

    case 'condition-applied':
      return [entry.combatantId, entry.sourceCombatantId];

    case 'attack':
      return [entry.combatantId, entry.targetId];

    case 'save-effect':
      return [
        entry.combatantId,
        ...entry.targets.map(target => target.targetId),
      ];

    case 'round-start':
    case 'initiative':
      return [];

    default: {
      const exhaustive: never = entry;
      return exhaustive;
    }
  }
};
