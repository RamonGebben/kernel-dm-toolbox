import { parseDieSides } from '~/server/simulator/engine/dice';
import type {
  EngineAction,
  EngineActionType,
  EngineSaveEffect,
} from '~/server/simulator/engine/types';

/**
 * The action-row fields this engine reads, shared verbatim across
 * `creature_actions`, `custom_creature_actions` and `player_character_
 * actions` (the latter two are deliberate field-for-field mirrors of the
 * first — see their own schema comments) — so one mapper serves all three
 * sources rather than three near-identical ones.
 */
export type EngineActionSourceFields = {
  name: string;
  actionType: string;
  legendaryActionCost: number | null;
  usesType: string | null;
  usesParam: number | null;
  saveAbility: string | null;
  saveDc: number | null;
  areaType: string | null;
  areaSize: number | null;
  damageOnFailRoll: string | null;
  damageOnFailType: string | null;
  halfDamageOnSave: boolean;
};

export type EngineAttackSourceFields = {
  toHitMod: number | null;
  reach: number | null;
  range: number | null;
  damageDieCount: number | null;
  damageDieType: string | null;
  damageBonus: number | null;
  damageType: string | null;
  extraDamageDieCount: number | null;
  extraDamageDieType: string | null;
  extraDamageBonus: number | null;
  extraDamageType: string | null;
};

/** 0 dice from an unparseable die-type label reads as "no dice from this
 * slot" rather than a broken roll — see `parseDieSides`. */
const toDieCount = (rawCount: number | null, dieTypeLabel: string | null) =>
  parseDieSides(dieTypeLabel) > 0 ? (rawCount ?? 0) : 0;

/**
 * Adapts one action(+attack) row, from any of the three mirrored action
 * tables, into the engine's own `EngineAction` shape. `id` is passed
 * separately since it comes from a different column per source (`slug` for
 * a library action, `id` for the other two) — the same trick
 * `toPlayerCharacterCombatantActions` uses.
 */
export const toEngineAction = (
  id: string,
  action: EngineActionSourceFields,
  attack: EngineAttackSourceFields | null,
): EngineAction => ({
  id,
  name: action.name,
  actionType: action.actionType as EngineActionType,
  legendaryActionCost: action.legendaryActionCost,
  attack: attack
    ? {
        toHitMod: attack.toHitMod ?? 0,
        reach: attack.reach,
        range: attack.range,
        damageDieCount: toDieCount(attack.damageDieCount, attack.damageDieType),
        damageDieType: parseDieSides(attack.damageDieType) || 6,
        damageBonus: attack.damageBonus ?? 0,
        damageType: attack.damageType,
        extraDamageDieCount: toDieCount(
          attack.extraDamageDieCount,
          attack.extraDamageDieType,
        ),
        extraDamageDieType: parseDieSides(attack.extraDamageDieType) || 6,
        extraDamageBonus: attack.extraDamageBonus ?? 0,
        extraDamageType: attack.extraDamageType,
      }
    : null,
  save:
    action.saveAbility && action.saveDc !== null
      ? {
          saveAbility: action.saveAbility,
          saveDc: action.saveDc,
          areaType: action.areaType as EngineSaveEffect['areaType'],
          areaSize: action.areaSize,
          damageOnFailRoll: action.damageOnFailRoll,
          damageOnFailType: action.damageOnFailType,
          halfDamageOnSave: action.halfDamageOnSave,
        }
      : null,
  // Open5e's usesType/usesParam are unstructured prose with no reliable
  // recharge-vs-per-day distinction — see `EngineAction.maxUsesPerEncounter`'s
  // own doc comment for why this collapses to a flat per-encounter cap.
  maxUsesPerEncounter: action.usesType ? (action.usesParam ?? 1) : null,
});
