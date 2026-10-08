import { describe, expect, it } from 'vitest';
import { toCharacterColumns } from '~/server/trpc/helpers/toCharacterColumns';
import type { CreateCharacterInput } from '~/server/trpc/schemas/characters';

const input: CreateCharacterInput = {
  name: 'Sigrid',
  playerName: 'Anna',
  armorClass: 20,
  maxHitPoints: 45,
  initiativeModifier: 2,
  level: 5,
  className: 'Paladin',
  subclass: 'Oath of Glory',
  species: 'Goliath',
  isActive: true,
  passivePerception: 13,
  passiveInsight: null,
  passiveInvestigation: 10,
  notes: 'Owes the Harpers a favour.',
};

describe('toCharacterColumns', () => {
  it('passes every filled-in field through', () => {
    expect(toCharacterColumns(input)).toEqual(input);
  });

  it('stores blank optional text as null, not an empty string', () => {
    const columns = toCharacterColumns({
      ...input,
      playerName: '',
      subclass: '',
      species: undefined,
      notes: '',
    });

    expect(columns).toMatchObject({
      playerName: null,
      subclass: null,
      species: null,
      notes: null,
    });
  });

  it('keeps an unrecorded passive score as null rather than 0', () => {
    expect(toCharacterColumns(input).passiveInsight).toBeNull();
  });

  it('does not mutate its input', () => {
    const original = structuredClone(input);
    toCharacterColumns(input);

    expect(input).toEqual(original);
  });
});
