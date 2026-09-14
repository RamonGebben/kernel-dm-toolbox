import type { TurnLogEntry } from '~/server/simulator/engine/types';

const nameOf = (namesById: ReadonlyMap<string, string>, id: string): string =>
  namesById.get(id) ?? 'Unknown combatant';

/**
 * Turns one `TurnLogEntry` into a single human-readable line for the battle
 * viewer's turn log panel — "Goblin #2 attacks Fighter with Scimitar: hits
 * for 6 slashing damage." Pure and colocated so this formatting isn't buried
 * inline in a component; `BattleViewerView` calls this once per revealed
 * entry.
 *
 * Most entry kinds only carry combatant/target *ids* (`attack`, `move`,
 * `save-effect`, `no-action`) — `namesById` (built once from the stream's
 * `start` frame, names never change mid-run) resolves them to display names.
 * `initiative` and `defeated` already carry their own `name` field and don't
 * need the lookup.
 */
export const formatBattleLogEntry = (
  entry: TurnLogEntry,
  namesById: ReadonlyMap<string, string>,
): string => {
  switch (entry.kind) {
    case 'round-start':
      return `— Round ${entry.round} —`;

    case 'initiative':
      return `Initiative: ${entry.order
        .map(({ name, roll }) => `${name} (${roll})`)
        .join(', ')}`;

    case 'move':
      return `${nameOf(namesById, entry.combatantId)} moves.`;

    case 'attack': {
      const actor = nameOf(namesById, entry.combatantId);
      const target = nameOf(namesById, entry.targetId);
      const critSuffix = entry.critical ? ' (critical hit!)' : '';

      if (!entry.hit) {
        return `${actor} attacks ${target} with ${entry.actionName}: misses (rolled ${entry.attackRoll} vs AC ${entry.targetArmorClass}).`;
      }

      return `${actor} attacks ${target} with ${entry.actionName}: hits for ${entry.damage} damage${critSuffix}.`;
    }

    case 'save-effect': {
      const actor = nameOf(namesById, entry.combatantId);
      const targetSummaries = entry.targets
        .map(target => {
          const targetName = nameOf(namesById, target.targetId);
          const resistedSuffix = target.usedLegendaryResistance
            ? ' (Legendary Resistance)'
            : '';
          const outcome = target.succeeded
            ? `saves${resistedSuffix}`
            : 'fails the save';
          return `${targetName} ${outcome}${
            target.damage > 0 ? ` for ${target.damage} damage` : ''
          }`;
        })
        .join('; ');

      return `${actor} uses ${entry.actionName} (DC ${entry.saveDc}): ${targetSummaries}.`;
    }

    case 'defeated':
      return `${entry.name} is defeated!`;

    case 'no-action': {
      const reason =
        entry.reason === 'no-living-enemies'
          ? 'no living enemies'
          : entry.reason === 'incapacitated'
            ? 'incapacitated'
            : 'no eligible action';
      return `${nameOf(namesById, entry.combatantId)} has nothing to do (${reason}).`;
    }

    case 'condition-applied':
      return `${nameOf(namesById, entry.combatantId)} is now ${entry.conditionKey}.`;

    case 'condition-removed': {
      const reason =
        entry.reason === 'expired'
          ? 'wears off'
          : entry.reason === 'save-succeeded'
            ? 'is shaken off'
            : 'ends (concentration broken)';
      return `${nameOf(namesById, entry.combatantId)}'s ${entry.conditionKey} ${reason}.`;
    }

    case 'concentration-check': {
      const name = nameOf(namesById, entry.combatantId);
      return entry.succeeded
        ? `${name} maintains concentration (rolled ${entry.roll} vs DC ${entry.dc}).`
        : `${name} loses concentration (rolled ${entry.roll} vs DC ${entry.dc}).`;
    }

    case 'down':
      return `${entry.name} drops to 0 HP and is dying!`;

    case 'death-save': {
      const name = nameOf(namesById, entry.combatantId);
      if (entry.roll === null) {
        const plural = entry.failuresAdded > 1 ? 's' : '';
        return `${name} takes damage at 0 HP: ${entry.failuresAdded} automatic death save failure${plural} (${entry.successes} successes, ${entry.failures} failures).`;
      }
      if (entry.isNatural20) {
        return `${name} rolls a natural 20 on their death save and returns to consciousness!`;
      }
      const outcome = entry.failuresAdded > 0 ? 'fails' : 'succeeds on';
      const natSuffix = entry.roll === 1 ? ' (natural 1, counts as two)' : '';
      return `${name} ${outcome} a death save (rolled ${entry.roll}${natSuffix}): ${entry.successes} successes, ${entry.failures} failures.`;
    }

    case 'stabilized':
      return `${nameOf(namesById, entry.combatantId)} stabilizes.`;

    case 'revived':
      return `${nameOf(namesById, entry.combatantId)} regains consciousness with ${entry.hitPoints} HP!`;

    default: {
      const exhaustive: never = entry;
      return exhaustive;
    }
  }
};
