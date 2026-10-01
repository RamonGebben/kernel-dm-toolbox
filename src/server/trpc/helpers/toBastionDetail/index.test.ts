import { describe, expect, it } from 'vitest';
import {
  describeProject,
  toBastionDetail,
} from '~/server/trpc/helpers/toBastionDetail';

const owner = { id: 'o1', name: 'Sigrid', level: 9, className: 'Paladin' };

const base = {
  bastion: {
    id: 'b1',
    name: 'Highwatch',
    notes: null,
    defenderCount: 6,
    wallSquares: 0,
    isFullyEnclosed: false,
  },
  owner,
  specialFacilities: [],
  basicFacilities: [],
  openProjects: [],
  storageItems: [],
  characterNames: new Map([['o1', 'Sigrid']]),
};

const blankProject = {
  basicType: null,
  space: null,
  facilityId: null,
  wallSquares: null,
};

describe('toBastionDetail', () => {
  it("works out the owner's allowance", () => {
    const detail = toBastionDetail({
      ...base,
      specialFacilities: [
        { id: 'f1', facilityKey: 'barrack', space: 'roomy', variant: null },
      ],
    });

    expect(detail.allowance).toEqual({ held: 1, total: 4 });
  });

  it('fills facility names and hirelings in from the catalog', () => {
    const [smithy] = toBastionDetail({
      ...base,
      specialFacilities: [
        { id: 'f1', facilityKey: 'smithy', space: 'roomy', variant: null },
      ],
    }).specialFacilities;

    expect(smithy).toMatchObject({
      name: 'Smithy',
      order: 'craft',
      hirelings: 2,
    });
  });

  it('counts barrack beds, more for a Vast one', () => {
    const detail = toBastionDetail({
      ...base,
      specialFacilities: [
        { id: 'f1', facilityKey: 'barrack', space: 'vast', variant: null },
      ],
    });

    expect(detail.defenderCapacity).toBe(25);
  });

  it('offers enlarging only until it is done', () => {
    const detail = toBastionDetail({
      ...base,
      specialFacilities: [
        { id: 'f1', facilityKey: 'barrack', space: 'roomy', variant: null },
        { id: 'f2', facilityKey: 'barrack', space: 'vast', variant: null },
        { id: 'f3', facilityKey: 'library', space: 'roomy', variant: null },
      ],
    });

    expect(
      detail.specialFacilities.map(
        facility => facility.enlarge?.costGp ?? null,
      ),
    ).toEqual([2000, null, null]);
  });

  it('marks a facility with an enlargement under way', () => {
    const detail = toBastionDetail({
      ...base,
      basicFacilities: [{ id: 'k1', type: 'kitchen', space: 'cramped' }],
      openProjects: [
        {
          ...blankProject,
          id: 'p1',
          kind: 'enlarge-basic',
          facilityId: 'k1',
          space: 'roomy',
          costGp: 500,
          daysRemaining: 25,
        },
      ],
    });

    expect(detail.basicFacilities[0]).toMatchObject({
      label: 'Kitchen',
      isBeingEnlarged: true,
      enlarge: { to: 'roomy', costGp: 500, days: 25 },
    });
    expect(detail.projects[0]?.description).toBe('Enlarge Kitchen to Roomy');
  });

  it('keeps a facility whose catalog entry is unknown, by its key', () => {
    const [mystery] = toBastionDetail({
      ...base,
      specialFacilities: [
        { id: 'f1', facilityKey: 'lost-room', space: 'roomy', variant: null },
      ],
    }).specialFacilities;

    expect(mystery?.name).toBe('lost-room');
  });

  it('names who claimed a stored item', () => {
    const [item] = toBastionDetail({
      ...base,
      storageItems: [
        {
          id: 's1',
          name: 'Potion of Healing',
          quantity: 1,
          note: null,
          claimedByCharacterId: 'o1',
          claimedAt: new Date('2026-01-01'),
        },
      ],
    }).storage;

    expect(item?.claimedBy).toEqual({ id: 'o1', name: 'Sigrid' });
  });
});

describe('describeProject', () => {
  it('describes each kind of construction', () => {
    const names = new Map([['b1', 'Barrack']]);

    expect(
      describeProject(
        {
          ...blankProject,
          kind: 'add-basic',
          basicType: 'dining-room',
          space: 'vast',
        },
        names,
      ),
    ).toBe('Build a Vast Dining Room');
    expect(
      describeProject(
        {
          ...blankProject,
          kind: 'enlarge-special',
          facilityId: 'b1',
          space: 'vast',
        },
        names,
      ),
    ).toBe('Enlarge Barrack to Vast');
    expect(
      describeProject(
        { ...blankProject, kind: 'walls', wallSquares: 1 },
        names,
      ),
    ).toBe('Build 1 square of wall');
  });
});
