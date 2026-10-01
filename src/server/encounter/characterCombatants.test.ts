import { describe, expect, it } from 'vitest';
import {
  pickCharactersToAdd,
  toCharacterCombatant,
} from '~/server/encounter/characterCombatants';

const character = (id: string, isActive = true) => ({
  id,
  name: id,
  maxHitPoints: 30,
  armorClass: 15,
  isActive,
});

describe('pickCharactersToAdd', () => {
  it('takes every active member when nobody is in the fight yet', () => {
    const party = [character('hammie'), character('sigrid')];

    expect(pickCharactersToAdd(party, new Set())).toEqual(party);
  });

  it('skips members already in the fight', () => {
    const party = [character('hammie'), character('sigrid')];

    expect(
      pickCharactersToAdd(party, new Set(['hammie'])).map(({ id }) => id),
    ).toEqual(['sigrid']);
  });

  it('leaves benched members out', () => {
    const party = [character('hammie'), character('retired', false)];

    expect(pickCharactersToAdd(party, new Set()).map(({ id }) => id)).toEqual([
      'hammie',
    ]);
  });

  it('keeps the order it was given', () => {
    const party = [character('a'), character('c'), character('b')];

    expect(pickCharactersToAdd(party, new Set()).map(({ id }) => id)).toEqual([
      'a',
      'c',
      'b',
    ]);
  });
});

describe('toCharacterCombatant', () => {
  it('copies hit points and AC from the character at the moment they join', () => {
    expect(
      toCharacterCombatant(character('sigrid'), {
        encounterId: 'current',
        initiative: 14,
        sortOrder: 3,
      }),
    ).toEqual({
      encounterId: 'current',
      playerCharacterId: 'sigrid',
      displayName: 'sigrid',
      initiative: 14,
      currentHitPoints: 30,
      maxHitPoints: 30,
      armorClass: 15,
      sortOrder: 3,
    });
  });
});
