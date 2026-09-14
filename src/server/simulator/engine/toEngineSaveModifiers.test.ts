import { describe, expect, it } from 'vitest';
import {
  toEngineSaveModifiers,
  toPlayerCharacterSaveModifiers,
} from '~/server/simulator/engine/toEngineSaveModifiers';

describe('toEngineSaveModifiers', () => {
  it('falls back to the plain ability modifier when no explicit save bonus is set', () => {
    const result = toEngineSaveModifiers({
      abilityScoreStrength: 16,
      abilityScoreDexterity: 12,
      abilityScoreConstitution: 14,
      abilityScoreIntelligence: 8,
      abilityScoreWisdom: 10,
      abilityScoreCharisma: 6,
      savingThrowStrength: null,
      savingThrowDexterity: null,
      savingThrowConstitution: null,
      savingThrowIntelligence: null,
      savingThrowWisdom: null,
      savingThrowCharisma: null,
    });

    expect(result).toEqual({
      strength: 3,
      dexterity: 1,
      constitution: 2,
      intelligence: -1,
      wisdom: 0,
      charisma: -2,
    });
  });

  it('prefers an explicit proficient save bonus over the ability modifier', () => {
    const result = toEngineSaveModifiers({
      abilityScoreStrength: 16,
      abilityScoreDexterity: 12,
      abilityScoreConstitution: 14,
      abilityScoreIntelligence: 8,
      abilityScoreWisdom: 10,
      abilityScoreCharisma: 6,
      savingThrowStrength: 7,
      savingThrowDexterity: null,
      savingThrowConstitution: null,
      savingThrowIntelligence: null,
      savingThrowWisdom: null,
      savingThrowCharisma: null,
    });

    expect(result.strength).toBe(7);
    expect(result.dexterity).toBe(1);
  });
});

describe('toPlayerCharacterSaveModifiers', () => {
  it('uses the initiative modifier for every ability', () => {
    expect(toPlayerCharacterSaveModifiers(4)).toEqual({
      strength: 4,
      dexterity: 4,
      constitution: 4,
      intelligence: 4,
      wisdom: 4,
      charisma: 4,
    });
  });
});
