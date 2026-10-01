import { describe, expect, it } from 'vitest';
import {
  resolveSelectedBastionId,
  toFoundableCharacters,
} from '~/utils/bastionSelection';

describe('resolveSelectedBastionId', () => {
  const bastions = [{ id: 'a' }, { id: 'b' }];

  it('keeps a picked bastion that still exists', () => {
    expect(resolveSelectedBastionId('b', bastions)).toBe('b');
  });

  it('falls back to the first when nothing is picked', () => {
    expect(resolveSelectedBastionId(null, bastions)).toBe('a');
  });

  it('falls back to the first when the pick is gone', () => {
    expect(resolveSelectedBastionId('abandoned', bastions)).toBe('a');
  });

  it('is null with no bastions at all', () => {
    expect(resolveSelectedBastionId('a', [])).toBeNull();
  });
});

describe('toFoundableCharacters', () => {
  const character = (id: string, level: number, isActive = true) => ({
    id,
    name: id,
    level,
    isActive,
  });

  it('lists active members without a bastion', () => {
    expect(
      toFoundableCharacters(
        [character('sigrid', 5), character('hammie', 7)],
        [{ ownerId: 'hammie' }],
      ),
    ).toEqual([{ id: 'sigrid', name: 'sigrid', level: 5, canFound: true }]);
  });

  it('lists a member below level 5 as not yet able to', () => {
    expect(toFoundableCharacters([character('kid', 3)], [])).toEqual([
      { id: 'kid', name: 'kid', level: 3, canFound: false },
    ]);
  });

  it('leaves benched members out', () => {
    expect(toFoundableCharacters([character('gone', 9, false)], [])).toEqual(
      [],
    );
  });
});
