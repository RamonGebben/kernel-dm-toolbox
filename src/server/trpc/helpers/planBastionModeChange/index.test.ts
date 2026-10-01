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
  isArmoryStocked: false,
  hasGuestMonster: false,
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
      isArmoryStocked: false,
      hasGuestMonster: false,
    });
  });

  it('keeps a stocked Armory and a guest monster from any part', () => {
    expect(
      planBastionMerge(
        [
          bastion({ isArmoryStocked: true }),
          bastion({ hasGuestMonster: true }),
        ],
        'X',
      ),
    ).toMatchObject({ isArmoryStocked: true, hasGuestMonster: true });
  });
});

describe('planBastionSplit', () => {
  const split = planBastionSplit({
    keeperId: 'sigrid',
    liveCharacterIds: new Set(['sigrid', 'hammie']),
    isArmoryStocked: true,
    specialFacilities: [
      { id: 'barrack', facilityKey: 'barrack', holderCharacterId: 'sigrid' },
      { id: 'library', facilityKey: 'library', holderCharacterId: 'hammie' },
      { id: 'armory', facilityKey: 'armory', holderCharacterId: 'hammie' },
      { id: 'orphan', facilityKey: 'garden', holderCharacterId: null },
      { id: 'ghost', facilityKey: 'pub', holderCharacterId: 'removed' },
    ],
    basicFacilities: [
      { id: 'hammie-bed', contributedByCharacterId: 'hammie' },
      { id: 'built-later', contributedByCharacterId: null },
      { id: 'ghost-bed', contributedByCharacterId: 'removed' },
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

  it('gives the keeper what a removed character held or brought', () => {
    expect(split.ownerIds).not.toContain('removed');
    expect(split.specialFacilities.get('ghost')).toBe('sigrid');
    expect(split.basicFacilities.get('ghost-bed')).toBe('sigrid');
  });

  it('sends a stocked Armory with the Armory', () => {
    expect(split.stockedArmoryOwnerId).toBe('hammie');
  });
});
