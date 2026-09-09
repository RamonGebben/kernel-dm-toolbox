import type { EncounterState } from '~/server/encounter/state';
import type { HealthStatus } from '~/utils/applyDamage';

export type PlayerViewCondition = {
  conditionSlug: string;
  name: string;
};

export type PlayerViewCombatant = {
  id: string;
  displayName: string;
  initiative: number;
  isActive: boolean;
  isPlayerCharacter: boolean;
  healthStatus: HealthStatus;
  conditions: PlayerViewCondition[];
};

export type PlayerView = {
  roundNumber: number;
  combatants: PlayerViewCombatant[];
};

/**
 * What the table is allowed to see.
 *
 * Three rules, all enforced here rather than in a component, because this
 * runs on the server and its output is the entire payload sent to the
 * player screen:
 *
 *   1. Hidden combatants are omitted completely — not marked hidden, omitted.
 *      An ambusher that ships as `{ isHidden: true }` is spoiled by devtools.
 *   2. No exact hit points, for anyone. Players get healthy / bloodied /
 *      unconscious, which is what their characters could actually perceive.
 *   3. A condition's name crosses (Prone, Poisoned — normally visible in the
 *      fiction itself, unlike a hidden creature or exact HP), but its `note`
 *      (free DM text, can contain spoilers) and `roundsRemaining` (DM
 *      bookkeeping, the same "no exact numbers" class as HP) never do.
 */
export const toPlayerView = (state: EncounterState): PlayerView => ({
  roundNumber: state.roundNumber,
  combatants: state.combatants
    .filter(combatant => !combatant.isHidden)
    .map(combatant => ({
      id: combatant.id,
      displayName: combatant.displayName,
      initiative: combatant.initiative,
      isActive: combatant.id === state.activeCombatantId,
      isPlayerCharacter: combatant.isPlayerCharacter,
      healthStatus: combatant.healthStatus,
      conditions: combatant.conditions.map(({ conditionSlug, name }) => ({
        conditionSlug,
        name,
      })),
    })),
});
