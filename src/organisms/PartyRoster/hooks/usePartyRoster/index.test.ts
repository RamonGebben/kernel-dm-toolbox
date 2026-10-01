import { describe, expect, it } from 'vitest';
import {
  splitRoster,
  toCharacterFormValues,
  toCharacterInput,
  type PartyCharacter,
} from '~/organisms/PartyRoster/hooks/usePartyRoster';
import { emptyCharacterForm } from '~/molecules/CharacterForm';

const sigrid: PartyCharacter = {
  id: 'sigrid',
  name: 'Sigrid',
  playerName: 'Anna',
  level: 5,
  className: 'Paladin',
  subclass: 'Oath of Glory',
  species: 'Goliath',
  armorClass: 20,
  maxHitPoints: 45,
  initiativeModifier: 2,
  passivePerception: 13,
  passiveInsight: null,
  passiveInvestigation: 10,
  gold: 120,
  notes: 'Owes the Harpers a favour.',
  isActive: true,
};

describe('toCharacterFormValues', () => {
  it('turns stored nulls into blank boxes', () => {
    const values = toCharacterFormValues({
      ...sigrid,
      playerName: null,
      subclass: null,
      species: null,
      notes: null,
    });

    expect(values).toMatchObject({
      playerName: '',
      subclass: '',
      species: '',
      notes: '',
    });
  });

  it('keeps an unrecorded passive as null', () => {
    expect(toCharacterFormValues(sigrid).passiveInsight).toBeNull();
  });

  it('reads an unknown stored class as no class rather than crashing', () => {
    expect(
      toCharacterFormValues({ ...sigrid, className: 'Artificer' }).className,
    ).toBe('');
  });

  it('round-trips through toCharacterInput', () => {
    expect(toCharacterInput(toCharacterFormValues(sigrid))).toMatchObject({
      name: 'Sigrid',
      playerName: 'Anna',
      className: 'Paladin',
      subclass: 'Oath of Glory',
      species: 'Goliath',
      gold: 120,
      passiveInsight: null,
    });
  });
});

describe('toCharacterInput', () => {
  it('trims a name typed with stray whitespace', () => {
    expect(
      toCharacterInput({ ...emptyCharacterForm, name: '  Sigrid  ' }).name,
    ).toBe('Sigrid');
  });

  it('turns blank text into undefined, not an empty string', () => {
    const input = toCharacterInput({
      ...emptyCharacterForm,
      name: 'Hammie',
      playerName: '   ',
      subclass: '',
      species: ' ',
      notes: '',
    });

    expect(input.playerName).toBeUndefined();
    expect(input.subclass).toBeUndefined();
    expect(input.species).toBeUndefined();
    expect(input.notes).toBeUndefined();
  });

  it('turns "no class chosen" into null', () => {
    expect(toCharacterInput(emptyCharacterForm).className).toBeNull();
  });

  it('does not mutate the form values', () => {
    const values = { ...emptyCharacterForm, name: 'Hammie' };
    const original = { ...values };
    toCharacterInput(values);

    expect(values).toEqual(original);
  });
});

describe('splitRoster', () => {
  it('puts benched members in their own list, keeping order', () => {
    const roster = [
      { id: 'a', isActive: true },
      { id: 'b', isActive: false },
      { id: 'c', isActive: true },
    ];

    expect(splitRoster(roster)).toEqual({
      active: [roster[0], roster[2]],
      benched: [roster[1]],
    });
  });

  it('handles an empty roster', () => {
    expect(splitRoster([])).toEqual({ active: [], benched: [] });
  });
});
