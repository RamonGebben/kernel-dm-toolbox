import { parseDiceNotation } from '~/server/simulator/engine/dice';
import { proficiencyBonusForLevel } from '~/server/simulator/engine/proficiencyBonus';
import {
  progressionForClass,
  type ClassDefaultWeapon,
} from '~/content/classProgression';
import type { CharacterClass } from '~/server/db/schema';
import type { CharacterActionInput } from '~/server/trpc/schemas/characters';

/** Used for a class/subclass slug `progressionForClass` doesn't recognize at
 * all (there shouldn't be one among the 12 SRD-2024 base classes and their
 * subclasses, but a custom-imported class is not impossible) — a plain,
 * always-available melee attack rather than leaving the PC with nothing. */
const FALLBACK_WEAPON: ClassDefaultWeapon = {
  name: 'Improvised Weapon',
  attackType: 'Melee Weapon Attack',
  reach: 5,
  range: null,
  longRange: null,
  damageDieCount: 1,
  damageDieType: 'd4',
  damageType: 'bludgeoning',
};

const clampLevel = (level: number) => Math.min(Math.max(level, 1), 20);

/** A Monk's unarmed strike die grows with level (`martialArtsDieByLevel`)
 * rather than being fixed like every other class's `defaultWeapon` — this is
 * the one place that table gets read for materialization purposes. */
const monkUnarmedDieType = (
  martialArtsDieByLevel: ReadonlyArray<string | null> | undefined,
  level: number,
): string => {
  const notation = martialArtsDieByLevel?.[clampLevel(level) - 1] ?? '1d6';
  const parsed = parseDiceNotation(notation);
  return parsed ? `d${parsed.sides}` : 'd6';
};

/**
 * Builds a class-appropriate default weapon attack for a freshly class-
 * templated PC. Without this, a PC with no manually-entered attack has
 * nothing `selectAction` can choose — it only ever picks from actions with an
 * `attack` or a `save` — so a fresh martial PC would sit out every fight
 * logged as "has nothing to do (no eligible action)" until a DM hand-typed a
 * weapon in via the combat-data editor.
 *
 * To-hit and damage bonus use `abilityModifier` as a flat stand-in for the
 * weapon's governing ability score, the same simplification
 * `toEngineActionFromSpell` already documents for spell attacks —
 * `player_characters` has no ability scores to read a real one from.
 *
 * The weapon itself (`classProgression`'s `defaultWeapon`) is a hand-picked
 * guess, not the player's actual choice — freely replaceable afterward via
 * `characters.updateCombatData`, same as every other materialized row.
 */
export const buildDefaultWeaponAction = (
  characterClass: Pick<CharacterClass, 'slug' | 'subclassOfSlug'>,
  level: number,
  abilityModifier: number,
): CharacterActionInput => {
  const progression = progressionForClass(
    characterClass.slug,
    characterClass.subclassOfSlug,
  );
  const weapon = progression?.defaultWeapon ?? FALLBACK_WEAPON;

  const damageDieType =
    progression?.classSlug === 'srd-2024_monk'
      ? monkUnarmedDieType(progression.martialArtsDieByLevel, level)
      : weapon.damageDieType;

  const toHitMod = proficiencyBonusForLevel(level) + abilityModifier;
  const isMelee = weapon.attackType === 'Melee Weapon Attack';

  return {
    name: weapon.name,
    desc: `A ${isMelee ? 'melee' : 'ranged'} attack with a ${weapon.name.toLowerCase()}.`,
    actionType: 'ACTION',
    attack: {
      name: weapon.name,
      attackType: weapon.attackType,
      toHitMod,
      reach: weapon.reach ?? undefined,
      range: weapon.range ?? undefined,
      longRange: weapon.longRange ?? undefined,
      targetCreatureOnly: true,
      damageDieCount: weapon.damageDieCount,
      damageDieType,
      damageBonus: abilityModifier,
      damageType: weapon.damageType,
    },
  };
};
