import { abilityScoreToModifier } from '~/utils/formatModifier';
import type { EngineAbilityModifiers } from '~/server/simulator/engine/types';

/** The ability-score/saving-throw column pairs `creatures` and
 * `custom_creatures` both carry (field-for-field mirrors, same as the
 * action tables) — a non-null `savingThrowX` is an explicit proficient
 * bonus; null falls back to the plain ability modifier. */
/** A default ability score for the one column that's nullable in `creatures`
 * (`abilityScoreConstitution` — unlike its five siblings, upstream doesn't
 * guarantee every creature has one) — the flat 10/+0 an unset ability
 * would read as anyway. */
const DEFAULT_ABILITY_SCORE = 10;

export type SaveModifierSourceFields = {
  abilityScoreStrength: number;
  abilityScoreDexterity: number;
  abilityScoreConstitution: number | null;
  abilityScoreIntelligence: number;
  abilityScoreWisdom: number;
  abilityScoreCharisma: number;
  savingThrowStrength: number | null;
  savingThrowDexterity: number | null;
  savingThrowConstitution: number | null;
  savingThrowIntelligence: number | null;
  savingThrowWisdom: number | null;
  savingThrowCharisma: number | null;
};

export const toEngineSaveModifiers = (
  source: SaveModifierSourceFields,
): EngineAbilityModifiers => ({
  strength:
    source.savingThrowStrength ??
    abilityScoreToModifier(source.abilityScoreStrength),
  dexterity:
    source.savingThrowDexterity ??
    abilityScoreToModifier(source.abilityScoreDexterity),
  constitution:
    source.savingThrowConstitution ??
    abilityScoreToModifier(
      source.abilityScoreConstitution ?? DEFAULT_ABILITY_SCORE,
    ),
  intelligence:
    source.savingThrowIntelligence ??
    abilityScoreToModifier(source.abilityScoreIntelligence),
  wisdom:
    source.savingThrowWisdom ??
    abilityScoreToModifier(source.abilityScoreWisdom),
  charisma:
    source.savingThrowCharisma ??
    abilityScoreToModifier(source.abilityScoreCharisma),
});

/**
 * A PC has no ability scores in this data model (`player_characters` only
 * carries AC/HP/initiative) — its `initiativeModifier` stands in for every
 * ability's save modifier as a rough placeholder, the same simplification
 * `EngineCombatant.saveModifiers`' own doc comment flags.
 */
export const toPlayerCharacterSaveModifiers = (
  initiativeModifier: number,
): EngineAbilityModifiers => ({
  strength: initiativeModifier,
  dexterity: initiativeModifier,
  constitution: initiativeModifier,
  intelligence: initiativeModifier,
  wisdom: initiativeModifier,
  charisma: initiativeModifier,
});
