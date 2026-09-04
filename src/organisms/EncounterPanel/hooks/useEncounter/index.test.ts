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
  isPlayerCharacter: false,
};

describe('toEncounterState', () => {
  it('reads an absent query result as an empty encounter', () => {
    expect(toEncounterState(undefined)).toEqual({
      roundNumber: 0,
      activeCombatantId: null,
      combatants: [],
    });
  });

  it('passes loaded state through unchanged', () => {
    expect(
      toEncounterState({
        roundNumber: 3,
        activeCombatantId: 'meat',
        combatants: [combatant],
      }),
    ).toEqual({
      roundNumber: 3,
      activeCombatantId: 'meat',
      combatants: [combatant],
    });
  });

  it('never returns undefined combatants, which would crash a map', () => {
    expect(Array.isArray(toEncounterState(undefined).combatants)).toBe(true);
  });
});
