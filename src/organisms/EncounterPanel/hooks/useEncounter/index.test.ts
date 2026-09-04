import { describe, expect, it } from 'vitest';
import { toEncounterState } from '~/organisms/EncounterPanel/hooks/useEncounter';

const combatant = {
  id: 'meat',
  displayName: 'Meat',
  initiative: 19,
  currentHitPoints: 35,
  maxHitPoints: 52,
  temporaryHitPoints: 0,
  armorClass: 18,
  isHidden: false,
  isDelayed: false,
  conditions: [],
  isPlayerCharacter: false,
};

describe('toEncounterState', () => {
  const difficulty = {
    difficulty: 'moderate' as const,
    totalExperience: 2900,
    hasParty: true,
  };

  it('reads an absent query result as an empty encounter', () => {
    expect(toEncounterState(undefined)).toEqual({
      roundNumber: 0,
      activeCombatantId: null,
      combatants: [],
      difficulty: {
        difficulty: 'trivial',
        totalExperience: 0,
        hasParty: false,
      },
    });
  });

  it('passes loaded state through unchanged', () => {
    expect(
      toEncounterState({
        roundNumber: 3,
        activeCombatantId: 'meat',
        combatants: [combatant],
        difficulty,
      }),
    ).toEqual({
      roundNumber: 3,
      activeCombatantId: 'meat',
      combatants: [combatant],
      difficulty,
    });
  });

  it('never returns undefined combatants, which would crash a map', () => {
    expect(Array.isArray(toEncounterState(undefined).combatants)).toBe(true);
  });
});
