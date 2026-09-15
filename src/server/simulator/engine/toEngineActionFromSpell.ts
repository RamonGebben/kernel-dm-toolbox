import { parseDiceNotation } from '~/server/simulator/engine/dice';
import { conditionKeyFromSlug } from '~/server/simulator/engine/conditionEffects';
import { proficiencyBonusForLevel } from '~/server/simulator/engine/proficiencyBonus';
import type {
  EngineAction,
  EngineActionType,
  EngineSaveEffect,
} from '~/server/simulator/engine/types';

/** The `spells` columns this adapter reads — a PC's known/prepared spell,
 * joined to its library row. Distinct from `EngineActionSourceFields`
 * (`toEngineAction.ts`'s own source-fields type): `spells` doesn't share
 * `creature_actions`/`custom_creature_actions`/`player_character_actions`'
 * mirrored shape (no `usesType`/`usesParam`, a single `damageRoll` string
 * instead of split dice-count/die-type columns, `shapeType`/`shapeSize`
 * instead of `areaType`/`areaSize`), so this is its own mapper rather than a
 * variant of that one. */
export type EngineSpellSourceFields = {
  /** `spells.slug` — used as this action's own `id`, since a PC can only
   * know a given spell once, unlike a weapon action's row id. */
  slug: string;
  name: string;
  level: number;
  castingTime: string;
  range: number;
  rangeUnit: string | null;
  savingThrowAbility: string | null;
  attackRoll: boolean;
  damageRoll: string | null;
  damageTypes: string[];
  concentration: boolean;
  appliesConditionSlug: string | null;
  conditionDurationRounds: number | null;
  conditionSaveEndsEachTurn: boolean;
  shapeType: string | null;
  shapeSize: number | null;
};

/** Open5e's `castingTime` is free prose ("1 action", "1 bonus action", "1
 * reaction", "1 minute", …) with no structured column — this engine has no
 * action-economy model precise enough to need more than "does the word
 * bonus/reaction appear," so anything else (including a ritual's 10-minute
 * casting time) defaults to a plain action. */
const actionTypeFromCastingTime = (castingTime: string): EngineActionType => {
  const lower = castingTime.toLowerCase();
  if (lower.includes('bonus')) return 'BONUS_ACTION';
  if (lower.includes('reaction')) return 'REACTION';
  return 'ACTION';
};

/** Open5e's spell `shapeType` vocabulary onto the engine's `cone|line|
 * sphere|cube` area union — the same "Emanation collapses to sphere, the
 * closest equivalent" call `parseCreatureActionSaveArea` already made for
 * monster actions (issue #5, milestone 1), kept consistent here rather than
 * reusing `~/utils/mapMeasurement`'s own `mapSpellShapeType`, which targets
 * the Maps tool's different shape enum (it has a `circle`/`ruler`, this one
 * doesn't). An unrecognised value returns null — the spell just resolves as
 * single-target rather than guessing wrong. */
const toEngineAreaType = (
  upstreamShapeType: string | null,
): EngineSaveEffect['areaType'] => {
  switch (upstreamShapeType) {
    case 'sphere':
    case 'cylinder':
    case 'emanation':
      return 'sphere';
    case 'cone':
      return 'cone';
    case 'line':
      return 'line';
    case 'cube':
    case 'square':
      return 'cube';
    default:
      return null;
  }
};

/** A touch/self spell (`range` of 0, or no `rangeUnit`) reads as a plain
 * 5-foot melee reach — the same "no reach or range set defaults to 5 feet"
 * convention `selectAction.ts`'s `attackRangeFeet` already uses. Anything
 * else is treated as a ranged attack at `range` feet regardless of the
 * upstream unit label, the same "collapse everything to feet" simplification
 * `EngineSaveEffect.areaSize` already documents for AoE size. */
const toEngineReachOrRange = (
  range: number,
  rangeUnit: string | null,
): { reach: number | null; range: number | null } =>
  range <= 0 || !rangeUnit ? { reach: 5, range: null } : { reach: null, range };

/**
 * Adapts one PC's known/prepared spell into the engine's unified
 * `EngineAction` shape (issue #5, milestone 11) — the same target shape
 * `toEngineAction.ts` produces for a weapon attack or monster action, so
 * `resolveAction.ts`/`selectAction.ts` need no spell-specific branch to
 * resolve or choose it.
 *
 * `id` is the spell's own slug (unique per PC, since a PC can only know a
 * given spell once). `characterLevel` drives both the spell attack bonus and
 * save DC via `proficiencyBonusForLevel` — `player_characters` has no
 * spellcasting-ability score, so `abilityModifier` (the same
 * `initiativeModifier` stand-in `toPlayerCharacterSaveModifiers` already
 * uses for every ability) fills that role here too, documented as the same
 * simplification rather than a second one.
 */
export const toEngineActionFromSpell = (
  spell: EngineSpellSourceFields,
  characterLevel: number,
  abilityModifier: number,
): EngineAction => {
  const proficiencyBonus = proficiencyBonusForLevel(characterLevel);
  const spellModifier = proficiencyBonus + abilityModifier;
  const isCantrip = spell.level === 0;
  const { reach, range } = toEngineReachOrRange(spell.range, spell.rangeUnit);
  const primaryDamageType = spell.damageTypes[0] ?? null;
  const parsedDamage = spell.damageRoll
    ? parseDiceNotation(spell.damageRoll)
    : null;

  return {
    id: `spell:${spell.slug}`,
    name: spell.name,
    actionType: actionTypeFromCastingTime(spell.castingTime),
    legendaryActionCost: null,
    attack: spell.attackRoll
      ? {
          toHitMod: spellModifier,
          reach,
          range,
          damageDieCount: parsedDamage?.count ?? 0,
          damageDieType: parsedDamage?.sides ?? 6,
          damageBonus: parsedDamage?.bonus ?? 0,
          damageType: primaryDamageType,
          extraDamageDieCount: 0,
          extraDamageDieType: 6,
          extraDamageBonus: 0,
          extraDamageType: null,
        }
      : null,
    save: spell.savingThrowAbility
      ? {
          saveAbility: spell.savingThrowAbility,
          // 5e's own formula: 8 + proficiency bonus + spellcasting ability
          // modifier.
          saveDc: 8 + spellModifier,
          areaType: toEngineAreaType(spell.shapeType),
          areaSize: spell.shapeSize,
          damageOnFailRoll: spell.damageRoll,
          damageOnFailType: primaryDamageType,
          // `spells` carries no "half damage on a successful save" column,
          // unlike `creature_actions`' own hand/parser-set
          // `halfDamageOnSave` — true matches the common case (most
          // damaging save spells halve on a save); a documented
          // simplification for the minority that fully negate instead.
          halfDamageOnSave: true,
          appliesConditionKey: spell.appliesConditionSlug
            ? conditionKeyFromSlug(spell.appliesConditionSlug)
            : null,
          conditionDurationRounds: spell.conditionDurationRounds,
          conditionSaveEndsEachTurn: spell.conditionSaveEndsEachTurn,
        }
      : null,
    // Slot consumption is a shared-pool gate (`requiresSpellSlotLevel`
    // below), not a per-action cap — a cast never counts against this.
    maxUsesPerEncounter: null,
    requiresConcentration: spell.concentration,
    isSpell: true,
    requiresSpellSlotLevel: isCantrip ? null : spell.level,
  };
};
