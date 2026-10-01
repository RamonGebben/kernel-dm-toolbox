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
  members: [{ ...owner, isActive: true }],
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
        {
          id: 'f1',
          facilityKey: 'barrack',
          space: 'roomy',
          variant: null,
          holderCharacterId: 'o1',
        },
      ],
    });

    expect(detail.allowance).toEqual({ held: 1, total: 4 });
  });

  it('fills facility names and hirelings in from the catalog', () => {
    const [smithy] = toBastionDetail({
      ...base,
      specialFacilities: [
        {
          id: 'f1',
          facilityKey: 'smithy',
          space: 'roomy',
          variant: null,
          holderCharacterId: 'o1',
        },
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
        {
          id: 'f1',
          facilityKey: 'barrack',
          space: 'vast',
          variant: null,
          holderCharacterId: 'o1',
        },
      ],
    });

    expect(detail.defenderCapacity).toBe(25);
  });

  it('offers enlarging only until it is done', () => {
    const detail = toBastionDetail({
      ...base,
      specialFacilities: [
        {
          id: 'f1',
          facilityKey: 'barrack',
          space: 'roomy',
          variant: null,
          holderCharacterId: 'o1',
        },
        {
          id: 'f2',
          facilityKey: 'barrack',
          space: 'vast',
          variant: null,
          holderCharacterId: 'o1',
        },
        {
          id: 'f3',
          facilityKey: 'library',
          space: 'roomy',
          variant: null,
          holderCharacterId: 'o1',
        },
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
      basicFacilities: [
        {
          id: 'k1',
          type: 'kitchen',
          space: 'cramped',
          contributedByCharacterId: 'o1',
        },
      ],
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
        {
          id: 'f1',
          facilityKey: 'lost-room',
          space: 'roomy',
          variant: null,
          holderCharacterId: 'o1',
        },
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

describe('toBastionDetail duplicates', () => {
  it('flags a second copy of a one-of facility, but not of a Garden', () => {
    const detail = toBastionDetail({
      ...base,
      specialFacilities: [
        {
          id: 'l1',
          facilityKey: 'library',
          space: 'roomy',
          variant: null,
          holderCharacterId: 'o1',
        },
        {
          id: 'l2',
          facilityKey: 'library',
          space: 'roomy',
          variant: null,
          holderCharacterId: 'o1',
        },
        {
          id: 'g1',
          facilityKey: 'garden',
          space: 'roomy',
          variant: null,
          holderCharacterId: 'o1',
        },
        {
          id: 'g2',
          facilityKey: 'garden',
          space: 'roomy',
          variant: null,
          holderCharacterId: 'o1',
        },
      ],
    });

    expect(
      detail.specialFacilities.map(facility => facility.isDuplicate),
    ).toEqual([false, true, false, false]);
  });
});

describe('toBastionDetail for a party bastion', () => {
  const hammie = {
    id: 'h1',
    name: 'Hammie',
    level: 5,
    className: 'Rogue',
    isActive: true,
  };
  const pip = {
    id: 'p1',
    name: 'Pip',
    level: 3,
    className: null,
    isActive: true,
  };

  const party = (overrides = {}) =>
    toBastionDetail({
      ...base,
      owner: null,
      members: [{ ...owner, isActive: true }, hammie, pip],
      characterNames: new Map([
        ['o1', 'Sigrid'],
        ['h1', 'Hammie'],
      ]),
      ...overrides,
    });

  it('is a party bastion with no owner', () => {
    expect(party()).toMatchObject({ kind: 'party', owner: null });
  });

  it("counts each member's facilities against their own allowance", () => {
    const detail = party({
      specialFacilities: [
        {
          id: 'f1',
          facilityKey: 'barrack',
          space: 'roomy',
          variant: null,
          holderCharacterId: 'o1',
        },
        {
          id: 'f2',
          facilityKey: 'library',
          space: 'roomy',
          variant: null,
          holderCharacterId: 'h1',
        },
        {
          id: 'f3',
          facilityKey: 'garden',
          space: 'roomy',
          variant: null,
          holderCharacterId: 'h1',
        },
      ],
    });

    expect(
      detail.members.map(member => [member.name, member.allowance]),
    ).toEqual([
      ['Sigrid', { held: 1, total: 4 }],
      ['Hammie', { held: 2, total: 2 }],
      ['Pip', { held: 0, total: 0 }],
    ]);
    expect(detail.allowance).toEqual({ held: 3, total: 6 });
  });

  it('says who holds each facility', () => {
    const detail = party({
      specialFacilities: [
        {
          id: 'f2',
          facilityKey: 'library',
          space: 'roomy',
          variant: null,
          holderCharacterId: 'h1',
        },
      ],
    });

    expect(detail.specialFacilities[0]?.holder).toEqual({
      id: 'h1',
      name: 'Hammie',
    });
  });

  it('asks for the free rooms of a level 5+ member who has not brought them', () => {
    const detail = party({
      basicFacilities: [
        {
          id: 'r1',
          type: 'bedroom',
          space: 'cramped',
          contributedByCharacterId: 'o1',
        },
      ],
    });

    // Sigrid brought hers, Pip is not level 5 yet.
    expect(detail.pendingFreeRooms).toEqual([{ id: 'h1', name: 'Hammie' }]);
  });

  it('never asks in a per-character bastion', () => {
    expect(toBastionDetail(base).pendingFreeRooms).toEqual([]);
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
