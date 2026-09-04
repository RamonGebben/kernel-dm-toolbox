import { describe, expect, it } from 'vitest';
import {
  toCharacterInput,
  toCombatantCharacterIds,
} from '~/organisms/CharacterRoster/hooks/useCharacterRoster';

const values = {
  name: 'Sigrid',
  playerName: 'Anna',
  armorClass: 20,
  maxHitPoints: 45,
  initiativeModifier: 2,
  level: 5,
};

describe('toCharacterInput', () => {
  it('passes the numbers through untouched', () => {
    expect(toCharacterInput(values)).toMatchObject({
      armorClass: 20,
      maxHitPoints: 45,
      initiativeModifier: 2,
      level: 5,
    });
  });

  it('trims a name that was typed with stray whitespace', () => {
    expect(toCharacterInput({ ...values, name: '  Sigrid  ' }).name).toBe(
      'Sigrid',
    );
  });

  it('turns an empty player name into undefined, not an empty string', () => {
    // Otherwise "no player" has two representations and every reader of the
    // field has to know about both.
    expect(
      toCharacterInput({ ...values, playerName: '' }).playerName,
    ).toBeUndefined();
    expect(
      toCharacterInput({ ...values, playerName: '   ' }).playerName,
    ).toBeUndefined();
  });

  it('keeps a real player name, trimmed', () => {
    expect(
      toCharacterInput({ ...values, playerName: ' Anna ' }).playerName,
    ).toBe('Anna');
  });

  it('does not mutate the form values', () => {
    const original = { ...values };
    toCharacterInput(values);

    expect(values).toEqual(original);
  });
});

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
