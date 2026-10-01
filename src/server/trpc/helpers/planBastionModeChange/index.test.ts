import { describe, expect, it } from 'vitest';
import {
  planBastionMerge,
  planBastionSplit,
} from '~/server/trpc/helpers/planBastionModeChange';

const bastion = (overrides: object) => ({
  id: 'b',
  name: 'B',
  notes: null,
  defenderCount: 0,
  wallSquares: 0,
  isFullyEnclosed: false,
  ...overrides,
});

describe('planBastionMerge', () => {
  it('pools defenders and walls', () => {
    expect(
      planBastionMerge(
        [
          bastion({ defenderCount: 4, wallSquares: 10 }),
          bastion({ defenderCount: 6, wallSquares: 2 }),
        ],
        'Party Hall',
      ),
    ).toMatchObject({ name: 'Party Hall', defenderCount: 10, wallSquares: 12 });
  });

  it('is fully enclosed only if every part was', () => {
    expect(
      planBastionMerge(
        [
          bastion({ isFullyEnclosed: true }),
          bastion({ isFullyEnclosed: false }),
        ],
        'X',
      ).isFullyEnclosed,
    ).toBe(false);
    expect(
      planBastionMerge([bastion({ isFullyEnclosed: true })], 'X')
        .isFullyEnclosed,
    ).toBe(true);
  });

  it('keeps every set of notes', () => {
    expect(
      planBastionMerge(
        [
          bastion({ notes: 'Cliffs.' }),
          bastion({}),
          bastion({ notes: 'Moat.' }),
        ],
        'X',
      ).notes,
    ).toBe('Cliffs.\n\nMoat.');
  });

  it('starts empty when merging nothing', () => {
    expect(planBastionMerge([], 'X')).toEqual({
      name: 'X',
      notes: null,
      defenderCount: 0,
      wallSquares: 0,
      isFullyEnclosed: false,
    });
  });
});

describe('planBastionSplit', () => {
  const split = planBastionSplit({
    keeperId: 'sigrid',
    specialFacilities: [
      { id: 'barrack', holderCharacterId: 'sigrid' },
      { id: 'library', holderCharacterId: 'hammie' },
      { id: 'orphan', holderCharacterId: null },
    ],
    basicFacilities: [
      { id: 'hammie-bed', contributedByCharacterId: 'hammie' },
      { id: 'built-later', contributedByCharacterId: null },
    ],
    projects: [
      { id: 'enlarge-library', facilityId: 'library' },
      { id: 'walls', facilityId: null },
    ],
    storageItems: [{ id: 'potion' }],
  });

  it('gives a bastion to the keeper and every holder or contributor', () => {
    expect(split.ownerIds).toEqual(['sigrid', 'hammie']);
  });

  it('sends each facility to its holder', () => {
    expect(split.specialFacilities.get('library')).toBe('hammie');
    expect(split.specialFacilities.get('barrack')).toBe('sigrid');
  });

  it('gives the keeper what nobody held or brought', () => {
    expect(split.specialFacilities.get('orphan')).toBe('sigrid');
    expect(split.basicFacilities.get('built-later')).toBe('sigrid');
    expect(split.storageItems.get('potion')).toBe('sigrid');
  });

  it('sends a room back to whoever brought it', () => {
    expect(split.basicFacilities.get('hammie-bed')).toBe('hammie');
  });

  it('lets an enlargement follow its facility; other work stays with the keeper', () => {
    expect(split.projects.get('enlarge-library')).toBe('hammie');
    expect(split.projects.get('walls')).toBe('sigrid');
  });
});
