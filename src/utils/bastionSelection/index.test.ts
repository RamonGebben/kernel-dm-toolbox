import { describe, expect, it } from 'vitest';
import {
  findTopHolder,
  orderKeeperCandidates,
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

describe('findTopHolder', () => {
  it('picks whoever holds the most facilities', () => {
    expect(findTopHolder(['wren', 'sigrid', 'sigrid', null])).toBe('sigrid');
  });

  it('gives a tie to whoever comes first', () => {
    expect(findTopHolder(['wren', 'sigrid'])).toBe('wren');
  });

  it('is null when nobody holds anything', () => {
    expect(findTopHolder([null])).toBeNull();
  });
});

describe('orderKeeperCandidates', () => {
  const members = [{ id: 'bo' }, { id: 'sigrid' }, { id: 'wren' }];

  it('moves the suggested keeper to the front', () => {
    expect(
      orderKeeperCandidates(members, 'sigrid').map(({ id }) => id),
    ).toEqual(['sigrid', 'bo', 'wren']);
  });

  it('keeps the order without a suggestion', () => {
    expect(orderKeeperCandidates(members, null)).toEqual(members);
  });
});
