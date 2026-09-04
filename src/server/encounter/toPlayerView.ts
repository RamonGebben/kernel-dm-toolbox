import type { EncounterState } from '~/server/encounter/state';
import type { HealthStatus } from '~/utils/applyDamage';

export type PlayerViewCombatant = {
  id: string;
  displayName: string;
  initiative: number;
  isActive: boolean;
  isPlayerCharacter: boolean;
  healthStatus: HealthStatus;
};

export type PlayerView = {
  roundNumber: number;
  combatants: PlayerViewCombatant[];
};

/**
 * What the table is allowed to see.
 *
 * Two rules, both enforced here rather than in a component, because this runs
 * on the server and its output is the entire payload sent to the player
 * screen:
 *
 *   1. Hidden combatants are omitted completely — not marked hidden, omitted.
 *      An ambusher that ships as `{ isHidden: true }` is spoiled by devtools.
 *   2. No exact hit points, for anyone. Players get healthy / bloodied /
 *      unconscious, which is what their characters could actually perceive.
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
    })),
});
