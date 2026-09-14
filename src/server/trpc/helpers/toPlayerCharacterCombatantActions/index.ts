import type {
  PlayerCharacterAction,
  PlayerCharacterActionAttack,
} from '~/server/db/schema';
import type { StatblockSourceAction } from '~/server/trpc/helpers/buildStatblock';

/**
 * Adapts materialized `player_character_actions` rows into the same
 * `StatblockSourceAction` shape `buildStatblock` reads off a `Creature` (via
 * `slug`/`name`/`desc`/`actionType`/`sortOrder`/`legendaryActionCost`) —
 * `id` aliases to `slug`, the same trick `toCustomCreatureStatblockSource`
 * uses.
 *
 * This deliberately stops short of running a PC through `buildStatblock`
 * itself: `player_characters` has no ability scores, skills, size or type —
 * that data doesn't exist for a PC today and this milestone doesn't add it —
 * so there is no full `Statblock` to build. What the simulator engine (issue
 * #5, milestone 4) actually needs is "a combatant's list of actions with
 * structured attacks" regardless of source, matching how `combatants`
 * already unifies a creature/custom-creature/PC by reference rather than by
 * rendering. This adapter is that narrower unification for actions, scoped
 * to what milestone 2 can actually produce.
 */
export type PlayerCharacterCombatantAction = StatblockSourceAction & {
  attack: PlayerCharacterActionAttack | null;
};

export const toPlayerCharacterCombatantActions = (
  actions: readonly PlayerCharacterAction[],
  attacks: readonly PlayerCharacterActionAttack[],
): PlayerCharacterCombatantAction[] =>
  actions.map(action => ({
    slug: action.id,
    name: action.name,
    desc: action.desc,
    actionType: action.actionType,
    sortOrder: action.sortOrder,
    legendaryActionCost: action.legendaryActionCost,
    attack:
      attacks.find(attack => attack.playerCharacterActionId === action.id) ??
      null,
  }));
