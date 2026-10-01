import { describe, expect, it } from 'vitest';
import {
  hasCharactersToAdd,
  toCombatantCharacterIds,
  toPickableCharacters,
} from '~/organisms/CharacterRoster/hooks/useCharacterRoster';

describe('toCombatantCharacterIds', () => {
  it('reads an unloaded encounter as nobody in the fight', () => {
    expect(toCombatantCharacterIds(undefined)).toEqual([]);
  });

  it('collects the character ids that are in the fight', () => {
    expect(
      toCombatantCharacterIds({
        combatants: [
          { playerCharacterId: 'sigrid' },
          { playerCharacterId: 'hammie' },
        ],
      }),
    ).toEqual(['sigrid', 'hammie']);
  });

  it('ignores monsters, which have no character id', () => {
    expect(
      toCombatantCharacterIds({
        combatants: [
          { playerCharacterId: null },
          { playerCharacterId: 'sigrid' },
          { playerCharacterId: null },
        ],
      }),
    ).toEqual(['sigrid']);
  });

  it('returns nothing for an encounter with only monsters', () => {
    expect(
      toCombatantCharacterIds({
        combatants: [{ playerCharacterId: null }],
      }),
    ).toEqual([]);
  });
});

describe('toPickableCharacters', () => {
  it('offers active members only', () => {
    const roster = [
      { id: 'sigrid', isActive: true },
      { id: 'benched', isActive: false },
    ];

    expect(toPickableCharacters(roster)).toEqual([roster[0]]);
  });
});

describe('hasCharactersToAdd', () => {
  const party = [{ id: 'sigrid' }, { id: 'hammie' }];

  it('is true while someone is not yet in the fight', () => {
    expect(hasCharactersToAdd(party, ['sigrid'])).toBe(true);
  });

  it('is false once everyone is in', () => {
    expect(hasCharactersToAdd(party, ['sigrid', 'hammie'])).toBe(false);
  });

  it('is false with nobody to pick from', () => {
    expect(hasCharactersToAdd([], [])).toBe(false);
  });
});
