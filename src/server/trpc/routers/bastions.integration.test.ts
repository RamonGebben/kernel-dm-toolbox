import { beforeEach, describe, expect, it } from 'vitest';
import { eq, isNull } from 'drizzle-orm';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '~/server/db/schema';
import type { Database } from '~/server/db';
import { appRouter } from '~/server/trpc/routers/_app';
import { createCallerFactory } from '~/server/trpc/init';

/** Bastions against a real database: founding, facilities, construction, storage. */
const createCaller = createCallerFactory(appRouter);

let db: Database;
let caller: ReturnType<typeof createCaller>;

const addCharacter = (
  level: number,
  className: 'Wizard' | 'Fighter' = 'Wizard',
) =>
  caller.characters.create({
    name: `Owner ${level} ${className}`,
    armorClass: 15,
    maxHitPoints: 40,
    level,
    className,
  });

const foundFor = async (ownerCharacterId: string) =>
  caller.bastions.found({
    mode: 'per-character',
    ownerCharacterId,
    name: 'Highwatch',
    crampedBasicType: 'bedroom',
    roomyBasicType: 'kitchen',
  });

beforeEach(async () => {
  const client = createClient({ url: ':memory:' });
  db = drizzle(client, { schema }) as Database;
  await migrate(db, { migrationsFolder: 'src/server/db/migrations' });

  caller = createCaller({
    db,
    headers: new Headers(),
    campaignName: 'Test Campaign',
  });
});

describe('bastions.found', () => {
  it('starts with a free Cramped and Roomy basic facility', async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);

    const detail = await caller.bastions.get({ id: bastion.id });

    expect(detail.owner?.name).toBe(owner.name);
    expect(
      detail.basicFacilities.map(({ type, space }) => [type, space]),
    ).toEqual([
      ['bedroom', 'cramped'],
      ['kitchen', 'roomy'],
    ]);
    expect(detail.allowance).toEqual({ held: 0, total: 2 });
    expect(await caller.party.get()).toMatchObject({ treasuryGold: 0 });
  });

  it('allows one live bastion per character', async () => {
    const owner = await addCharacter(5);
    await foundFor(owner.id);

    await expect(foundFor(owner.id)).rejects.toThrow(/already has a bastion/);
  });

  it('lets a character found a new one after abandoning the old', async () => {
    const owner = await addCharacter(5);
    const first = await foundFor(owner.id);
    await caller.bastions.abandon({ id: first.id });

    await expect(foundFor(owner.id)).resolves.toMatchObject({
      ownerCharacterId: owner.id,
    });
    expect(await caller.bastions.list()).toHaveLength(1);
  });
});

describe('bastions.list', () => {
  it('shows each bastion with its owner and allowance', async () => {
    const owner = await addCharacter(9);
    const bastion = await foundFor(owner.id);
    await caller.bastions.addSpecialFacility({
      bastionId: bastion.id,
      facilityKey: 'library',
    });

    expect(await caller.bastions.list()).toEqual([
      {
        id: bastion.id,
        name: 'Highwatch',
        kind: 'character',
        ownerId: owner.id,
        ownerName: owner.name,
        ownerLevel: 9,
        memberCount: 1,
        topHolderId: owner.id,
        specialFacilityCount: 1,
        allowance: 4,
      },
    ]);
  });
});

describe('bastions.addSpecialFacility', () => {
  it('adds a facility at its catalog size', async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);

    await caller.bastions.addSpecialFacility({
      bastionId: bastion.id,
      facilityKey: 'arcane-study',
    });

    const [facility] = (await caller.bastions.get({ id: bastion.id }))
      .specialFacilities;
    expect(facility).toMatchObject({
      name: 'Arcane Study',
      space: 'roomy',
      order: 'craft',
    });
  });

  it('refuses a facility above the owner level, with the reason', async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);

    await expect(
      caller.bastions.addSpecialFacility({
        bastionId: bastion.id,
        facilityKey: 'archive',
      }),
    ).rejects.toThrow(/Needs character level 13/);
  });

  it('refuses an unmet prerequisite', async () => {
    const owner = await addCharacter(5, 'Fighter');
    const bastion = await foundFor(owner.id);

    await expect(
      caller.bastions.addSpecialFacility({
        bastionId: bastion.id,
        facilityKey: 'arcane-study',
      }),
    ).rejects.toThrow(/Arcane Focus/);
  });

  it('refuses a third facility at level 5', async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);
    for (const facilityKey of ['barrack', 'garden']) {
      await caller.bastions.addSpecialFacility({
        bastionId: bastion.id,
        facilityKey,
      });
    }

    await expect(
      caller.bastions.addSpecialFacility({
        bastionId: bastion.id,
        facilityKey: 'library',
      }),
    ).rejects.toThrow(/All 2 facilities/);
  });

  it('lets the DM override the rules explicitly', async () => {
    const owner = await addCharacter(5, 'Fighter');
    const bastion = await foundFor(owner.id);

    await caller.bastions.addSpecialFacility({
      bastionId: bastion.id,
      facilityKey: 'demiplane',
      ignoreRequirements: true,
    });

    expect(
      (await caller.bastions.get({ id: bastion.id })).specialFacilities,
    ).toHaveLength(1);
  });

  it('keeps a valid variant and drops an invalid one', async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);

    await caller.bastions.addSpecialFacility({
      bastionId: bastion.id,
      facilityKey: 'garden',
      variant: 'Herb',
    });
    await caller.bastions.addSpecialFacility({
      bastionId: bastion.id,
      facilityKey: 'garden',
      variant: 'Banana',
    });

    expect(
      (await caller.bastions.get({ id: bastion.id })).specialFacilities.map(
        facility => facility.variant,
      ),
    ).toEqual(['Herb', null]);
  });

  it('frees a slot once a facility is removed — a level-up swap', async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);
    const barrack = await caller.bastions.addSpecialFacility({
      bastionId: bastion.id,
      facilityKey: 'barrack',
    });
    await caller.bastions.addSpecialFacility({
      bastionId: bastion.id,
      facilityKey: 'garden',
    });

    await caller.bastions.removeSpecialFacility({ id: barrack.id });

    await expect(
      caller.bastions.addSpecialFacility({
        bastionId: bastion.id,
        facilityKey: 'library',
      }),
    ).resolves.toMatchObject({ facilityKey: 'library' });
  });
});

describe('bastions.setFacilityVariant', () => {
  it('changes a Garden type and refuses nonsense', async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);
    const garden = await caller.bastions.addSpecialFacility({
      bastionId: bastion.id,
      facilityKey: 'garden',
    });

    await caller.bastions.setFacilityVariant({
      id: garden.id,
      variant: 'Poison',
    });
    await expect(
      caller.bastions.setFacilityVariant({ id: garden.id, variant: 'Banana' }),
    ).rejects.toThrow(/not an option/);

    const [facility] = (await caller.bastions.get({ id: bastion.id }))
      .specialFacilities;
    expect(facility?.variant).toBe('Poison');
  });
});

describe('bastion construction', () => {
  const setUp = async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);
    await caller.party.adjustTreasury({ delta: 5000 });
    return bastion;
  };

  it('charges the treasury up front and lists the project', async () => {
    const bastion = await setUp();

    await caller.bastions.startProject({
      bastionId: bastion.id,
      request: { kind: 'add-basic', basicType: 'parlor', space: 'roomy' },
    });

    const detail = await caller.bastions.get({ id: bastion.id });
    expect(detail.projects).toEqual([
      expect.objectContaining({
        description: 'Build a Roomy Parlor',
        costGp: 1000,
        daysRemaining: 45,
      }),
    ]);
    expect(await caller.party.get()).toMatchObject({ treasuryGold: 4000 });
  });

  it('refuses what the treasury cannot pay for, spending nothing', async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);
    await caller.party.adjustTreasury({ delta: 400 });

    await expect(
      caller.bastions.startProject({
        bastionId: bastion.id,
        request: { kind: 'add-basic', basicType: 'parlor', space: 'cramped' },
      }),
    ).rejects.toThrow(/does not hold enough gold/);
    expect(await caller.party.get()).toMatchObject({ treasuryGold: 400 });
    expect((await caller.bastions.get({ id: bastion.id })).projects).toEqual(
      [],
    );
  });

  it('finishing a new room adds the facility', async () => {
    const bastion = await setUp();
    const project = await caller.bastions.startProject({
      bastionId: bastion.id,
      request: { kind: 'add-basic', basicType: 'parlor', space: 'roomy' },
    });

    await caller.bastions.finishProject({ id: project.id });

    const detail = await caller.bastions.get({ id: bastion.id });
    expect(detail.projects).toEqual([]);
    expect(detail.basicFacilities.map(facility => facility.type)).toContain(
      'parlor',
    );
  });

  it('enlarges a basic facility, one project at a time', async () => {
    const bastion = await setUp();
    const [bedroom] = (await caller.bastions.get({ id: bastion.id }))
      .basicFacilities;

    const project = await caller.bastions.startProject({
      bastionId: bastion.id,
      request: { kind: 'enlarge-basic', facilityId: bedroom!.id },
    });
    await expect(
      caller.bastions.startProject({
        bastionId: bastion.id,
        request: { kind: 'enlarge-basic', facilityId: bedroom!.id },
      }),
    ).rejects.toThrow(/already being enlarged/);

    await caller.bastions.finishProject({ id: project.id });

    const [enlarged] = (await caller.bastions.get({ id: bastion.id }))
      .basicFacilities;
    expect(enlarged?.space).toBe('roomy');
    expect(await caller.party.get()).toMatchObject({ treasuryGold: 4500 });
  });

  it('enlarges a Barrack to Vast, doubling its beds', async () => {
    const bastion = await setUp();
    const barrack = await caller.bastions.addSpecialFacility({
      bastionId: bastion.id,
      facilityKey: 'barrack',
    });

    const project = await caller.bastions.startProject({
      bastionId: bastion.id,
      request: { kind: 'enlarge-special', facilityId: barrack.id },
    });
    await caller.bastions.finishProject({ id: project.id });

    const detail = await caller.bastions.get({ id: bastion.id });
    expect(detail.specialFacilities[0]?.space).toBe('vast');
    expect(detail.defenderCapacity).toBe(25);
  });

  it('refuses to enlarge a facility the rules do not let grow', async () => {
    const bastion = await setUp();
    const library = await caller.bastions.addSpecialFacility({
      bastionId: bastion.id,
      facilityKey: 'library',
    });

    await expect(
      caller.bastions.startProject({
        bastionId: bastion.id,
        request: { kind: 'enlarge-special', facilityId: library.id },
      }),
    ).rejects.toThrow(/cannot be enlarged/);
    expect(await caller.party.get()).toMatchObject({ treasuryGold: 5000 });
  });

  it('builds walls onto the bastion', async () => {
    const bastion = await setUp();
    const project = await caller.bastions.startProject({
      bastionId: bastion.id,
      request: { kind: 'walls', squares: 4 },
    });

    await caller.bastions.finishProject({ id: project.id });

    expect((await caller.bastions.get({ id: bastion.id })).wallSquares).toBe(4);
    expect(await caller.party.get()).toMatchObject({ treasuryGold: 4000 });
  });

  it('cancelling refunds the treasury', async () => {
    const bastion = await setUp();
    const project = await caller.bastions.startProject({
      bastionId: bastion.id,
      request: { kind: 'add-basic', basicType: 'storage', space: 'vast' },
    });

    await caller.bastions.cancelProject({ id: project.id });

    expect(await caller.party.get()).toMatchObject({ treasuryGold: 5000 });
    expect((await caller.bastions.get({ id: bastion.id })).projects).toEqual(
      [],
    );
  });

  it('removing a facility mid-enlargement refunds the work', async () => {
    const bastion = await setUp();
    const barrack = await caller.bastions.addSpecialFacility({
      bastionId: bastion.id,
      facilityKey: 'barrack',
    });
    await caller.bastions.startProject({
      bastionId: bastion.id,
      request: { kind: 'enlarge-special', facilityId: barrack.id },
    });

    await caller.bastions.removeSpecialFacility({ id: barrack.id });

    expect(await caller.party.get()).toMatchObject({ treasuryGold: 5000 });
    expect((await caller.bastions.get({ id: bastion.id })).projects).toEqual(
      [],
    );
  });
});

describe('bastions.update', () => {
  it('records defenders and walls the DM sets by hand', async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);

    await caller.bastions.update({
      id: bastion.id,
      name: 'Highwatch Keep',
      defenderCount: 8,
      wallSquares: 20,
      isFullyEnclosed: true,
    });

    expect(await caller.bastions.get({ id: bastion.id })).toMatchObject({
      name: 'Highwatch Keep',
      defenderCount: 8,
      wallSquares: 20,
      isFullyEnclosed: true,
    });
  });
});

describe('bastion storage', () => {
  it('stores an item and records who claimed it', async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);

    const item = await caller.bastions.addStorageItem({
      bastionId: bastion.id,
      name: 'Potion of Healing',
      quantity: 2,
    });
    await caller.bastions.claimStorageItem({
      id: item.id,
      characterId: owner.id,
    });

    const [stored] = (await caller.bastions.get({ id: bastion.id })).storage;
    expect(stored).toMatchObject({
      name: 'Potion of Healing',
      quantity: 2,
      claimedBy: { id: owner.id, name: owner.name },
    });
  });

  it('un-claims and removes', async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);
    const item = await caller.bastions.addStorageItem({
      bastionId: bastion.id,
      name: 'Arcane Focus',
    });
    await caller.bastions.claimStorageItem({
      id: item.id,
      characterId: owner.id,
    });

    await caller.bastions.claimStorageItem({ id: item.id, characterId: null });
    expect(
      (await caller.bastions.get({ id: bastion.id })).storage[0]?.claimedBy,
    ).toBeNull();

    await caller.bastions.removeStorageItem({ id: item.id });
    expect((await caller.bastions.get({ id: bastion.id })).storage).toEqual([]);
  });
});

describe('the party bastion', () => {
  const rooms = {
    crampedBasicType: 'bedroom',
    roomyBasicType: 'kitchen',
  } as const;

  const partyOf = async () => {
    const sigrid = await caller.characters.create({
      name: 'Sigrid',
      armorClass: 18,
      maxHitPoints: 60,
      level: 9,
      className: 'Paladin',
    });
    const hammie = await caller.characters.create({
      name: 'Hammie',
      armorClass: 15,
      maxHitPoints: 35,
      level: 5,
      className: 'Rogue',
    });
    return { sigrid, hammie };
  };

  const foundParty = async (memberIds: Array<string>) => {
    await caller.bastions.setMode({ mode: 'party', name: 'Unused' });
    return caller.bastions.found({
      mode: 'party',
      name: 'The Hall',
      members: memberIds.map(characterId => ({ characterId, ...rooms })),
    });
  };

  it('is owned by nobody, and every member brings two free rooms', async () => {
    const { sigrid, hammie } = await partyOf();
    const hall = await foundParty([sigrid.id, hammie.id]);

    const detail = await caller.bastions.get({ id: hall.id });
    expect(detail.kind).toBe('party');
    expect(detail.owner).toBeNull();
    expect(detail.basicFacilities).toHaveLength(4);
    expect(detail.members.map(member => member.name)).toEqual([
      'Hammie',
      'Sigrid',
    ]);
  });

  it('allows only one party bastion', async () => {
    const { sigrid } = await partyOf();
    await foundParty([sigrid.id]);

    await expect(
      caller.bastions.found({
        mode: 'party',
        name: 'Second',
        members: [{ characterId: sigrid.id, ...rooms }],
      }),
    ).rejects.toThrow(/already has a bastion/);
  });

  it('refuses founding in the wrong mode', async () => {
    const { sigrid } = await partyOf();

    await expect(
      caller.bastions.found({
        mode: 'party',
        name: 'The Hall',
        members: [{ characterId: sigrid.id, ...rooms }],
      }),
    ).rejects.toThrow(/each character their own bastion/);
  });

  it("checks each member's facilities against their own allowance", async () => {
    const { sigrid, hammie } = await partyOf();
    const hall = await foundParty([sigrid.id, hammie.id]);

    for (const facilityKey of ['barrack', 'garden']) {
      await caller.bastions.addSpecialFacility({
        bastionId: hall.id,
        facilityKey,
        holderCharacterId: hammie.id,
      });
    }
    await expect(
      caller.bastions.addSpecialFacility({
        bastionId: hall.id,
        facilityKey: 'library',
        holderCharacterId: hammie.id,
      }),
    ).rejects.toThrow(/All 2 facilities/);

    // Sigrid's allowance is her own.
    await caller.bastions.addSpecialFacility({
      bastionId: hall.id,
      facilityKey: 'library',
      holderCharacterId: sigrid.id,
    });

    const detail = await caller.bastions.get({ id: hall.id });
    expect(
      detail.members.map(member => [member.name, member.allowance.held]),
    ).toEqual([
      ['Hammie', 2],
      ['Sigrid', 1],
    ]);
  });

  it('has one of each facility for the whole party', async () => {
    const { sigrid, hammie } = await partyOf();
    const hall = await foundParty([sigrid.id, hammie.id]);

    await caller.bastions.addSpecialFacility({
      bastionId: hall.id,
      facilityKey: 'library',
      holderCharacterId: sigrid.id,
    });

    await expect(
      caller.bastions.addSpecialFacility({
        bastionId: hall.id,
        facilityKey: 'library',
        holderCharacterId: hammie.id,
      }),
    ).rejects.toThrow(/Already in this bastion/);
  });

  it('still lets the four repeatable facilities appear more than once', async () => {
    const { sigrid, hammie } = await partyOf();
    const hall = await foundParty([sigrid.id, hammie.id]);

    for (const holderCharacterId of [sigrid.id, hammie.id]) {
      await caller.bastions.addSpecialFacility({
        bastionId: hall.id,
        facilityKey: 'garden',
        holderCharacterId,
      });
    }

    expect(
      (await caller.bastions.get({ id: hall.id })).specialFacilities,
    ).toHaveLength(2);
  });

  it('needs a member to hold a facility', async () => {
    const { sigrid } = await partyOf();
    const hall = await foundParty([sigrid.id]);

    await expect(
      caller.bastions.addSpecialFacility({
        bastionId: hall.id,
        facilityKey: 'library',
      }),
    ).rejects.toThrow(/which party member/);
  });

  it("asks for a late member's free rooms, then takes them once", async () => {
    const { sigrid, hammie } = await partyOf();
    const hall = await foundParty([sigrid.id]);

    expect(
      (await caller.bastions.get({ id: hall.id })).pendingFreeRooms,
    ).toEqual([{ id: hammie.id, name: 'Hammie' }]);

    await caller.bastions.addFreeRooms({
      bastionId: hall.id,
      characterId: hammie.id,
      ...rooms,
    });
    await expect(
      caller.bastions.addFreeRooms({
        bastionId: hall.id,
        characterId: hammie.id,
        ...rooms,
      }),
    ).rejects.toThrow(/already brought/);

    const detail = await caller.bastions.get({ id: hall.id });
    expect(detail.pendingFreeRooms).toEqual([]);
    expect(detail.basicFacilities).toHaveLength(4);
  });
});

describe('bastions.setMode', () => {
  const rooms = {
    crampedBasicType: 'bedroom',
    roomyBasicType: 'kitchen',
  } as const;

  it('merges every bastion into one, keeping who holds what', async () => {
    const sigrid = await addCharacter(9);
    const wizard = await addCharacter(5);
    const highwatch = await foundFor(sigrid.id);
    const tower = await caller.bastions.found({
      mode: 'per-character',
      ownerCharacterId: wizard.id,
      name: 'Tower',
      ...rooms,
    });
    await caller.bastions.addSpecialFacility({
      bastionId: highwatch.id,
      facilityKey: 'barrack',
    });
    await caller.bastions.addSpecialFacility({
      bastionId: tower.id,
      facilityKey: 'arcane-study',
    });
    await caller.bastions.update({
      id: highwatch.id,
      name: 'Highwatch',
      defenderCount: 4,
      wallSquares: 0,
      isFullyEnclosed: false,
    });
    await caller.bastions.update({
      id: tower.id,
      name: 'Tower',
      defenderCount: 3,
      wallSquares: 0,
      isFullyEnclosed: false,
    });

    await caller.bastions.setMode({ mode: 'party', name: 'The Hall' });

    const list = await caller.bastions.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ name: 'The Hall', kind: 'party' });

    const detail = await caller.bastions.get({ id: list[0]!.id });
    expect(detail.defenderCount).toBe(7);
    expect(detail.basicFacilities).toHaveLength(4);
    expect(
      detail.specialFacilities.map(facility => [
        facility.name,
        facility.holder?.id,
      ]),
    ).toEqual([
      ['Barrack', sigrid.id],
      ['Arcane Study', wizard.id],
    ]);
  });

  it('splits the party bastion back out by holder', async () => {
    const sigrid = await addCharacter(9);
    const wizard = await addCharacter(5);
    await caller.bastions.setMode({ mode: 'party', name: 'Unused' });
    const hall = await caller.bastions.found({
      mode: 'party',
      name: 'The Hall',
      members: [
        { characterId: sigrid.id, ...rooms },
        { characterId: wizard.id, ...rooms },
      ],
    });
    await caller.bastions.addSpecialFacility({
      bastionId: hall.id,
      facilityKey: 'arcane-study',
      holderCharacterId: wizard.id,
    });
    await caller.bastions.update({
      id: hall.id,
      name: 'The Hall',
      defenderCount: 9,
      wallSquares: 12,
      isFullyEnclosed: true,
    });

    await caller.bastions.setMode({
      mode: 'per-character',
      keeperCharacterId: sigrid.id,
    });

    const list = await caller.bastions.list();
    expect(list.map(row => [row.name, row.ownerId])).toEqual([
      ["Owner 5 Wizard's Bastion", wizard.id],
      ['The Hall', sigrid.id],
    ]);

    const kept = await caller.bastions.get({
      id: list.find(row => row.ownerId === sigrid.id)!.id,
    });
    expect(kept).toMatchObject({
      defenderCount: 9,
      wallSquares: 12,
      isFullyEnclosed: true,
    });
    expect(kept.basicFacilities).toHaveLength(2);

    const theirs = await caller.bastions.get({
      id: list.find(row => row.ownerId === wizard.id)!.id,
    });
    expect(theirs.specialFacilities.map(facility => facility.name)).toEqual([
      'Arcane Study',
    ]);
    expect(theirs.basicFacilities).toHaveLength(2);
    expect(theirs.defenderCount).toBe(0);
  });

  it('just switches when there are no bastions yet', async () => {
    await caller.bastions.setMode({ mode: 'party', name: 'Unused' });

    expect(await caller.party.get()).toMatchObject({ bastionMode: 'party' });
    expect(await caller.bastions.list()).toEqual([]);
  });
});

describe('giving a bastion up', () => {
  const withConstruction = async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);
    await caller.party.adjustTreasury({ delta: 5000 });
    await caller.bastions.startProject({
      bastionId: bastion.id,
      request: { kind: 'add-basic', basicType: 'parlor', space: 'roomy' },
    });
    expect(await caller.party.get()).toMatchObject({ treasuryGold: 4000 });

    return { owner, bastion };
  };

  it('abandoning refunds construction still under way', async () => {
    const { bastion } = await withConstruction();

    await caller.bastions.abandon({ id: bastion.id });

    expect(await caller.party.get()).toMatchObject({ treasuryGold: 5000 });
    const [project] = await db.query.bastionProjects.findMany();
    expect(project?.deletedAt).not.toBeNull();
  });

  it('removing a character abandons their bastion and refunds its work', async () => {
    const { owner, bastion } = await withConstruction();

    await caller.characters.remove({ id: owner.id });

    expect(await caller.bastions.list()).toEqual([]);
    await expect(caller.bastions.get({ id: bastion.id })).rejects.toThrow(
      /no longer exists/,
    );
    expect(await caller.party.get()).toMatchObject({ treasuryGold: 5000 });
  });

  it('hides a bastion left ownerless by a removal from before', async () => {
    const owner = await addCharacter(5);
    const bastion = await foundFor(owner.id);
    await db
      .update(schema.playerCharacters)
      .set({ deletedAt: new Date() })
      .where(eq(schema.playerCharacters.id, owner.id));

    expect(await caller.bastions.list()).toEqual([]);
    await expect(caller.bastions.get({ id: bastion.id })).rejects.toThrow(
      /no longer exists/,
    );
  });
});

describe('bastions.setMode keeps what a turn left behind', () => {
  const rooms = {
    crampedBasicType: 'bedroom',
    roomyBasicType: 'kitchen',
  } as const;

  const setFlags = (
    id: string,
    flags: { isArmoryStocked?: boolean; hasGuestMonster?: boolean },
  ) => db.update(schema.bastions).set(flags).where(eq(schema.bastions.id, id));

  it('carries a stocked Armory and a guest monster into the merge', async () => {
    const sigrid = await addCharacter(9, 'Fighter');
    const wizard = await addCharacter(5);
    const highwatch = await foundFor(sigrid.id);
    const tower = await caller.bastions.found({
      mode: 'per-character',
      ownerCharacterId: wizard.id,
      name: 'Tower',
      ...rooms,
    });
    await setFlags(highwatch.id, { isArmoryStocked: true });
    await setFlags(tower.id, { hasGuestMonster: true });

    await caller.bastions.setMode({ mode: 'party', name: 'The Hall' });

    const [merged] = await db.query.bastions.findMany({
      where: isNull(schema.bastions.deletedAt),
    });
    expect(merged).toMatchObject({
      isArmoryStocked: true,
      hasGuestMonster: true,
    });
  });

  it('sends the stocked Armory with the Armory, the guest with the keeper', async () => {
    const sigrid = await addCharacter(9, 'Fighter');
    const fighter = await addCharacter(9, 'Fighter');
    await caller.bastions.setMode({ mode: 'party', name: 'Unused' });
    const hall = await caller.bastions.found({
      mode: 'party',
      name: 'The Hall',
      members: [
        { characterId: sigrid.id, ...rooms },
        { characterId: fighter.id, ...rooms },
      ],
    });
    await caller.bastions.addSpecialFacility({
      bastionId: hall.id,
      facilityKey: 'armory',
      holderCharacterId: fighter.id,
      ignoreRequirements: true,
    });
    await setFlags(hall.id, { isArmoryStocked: true, hasGuestMonster: true });

    await caller.bastions.setMode({
      mode: 'per-character',
      keeperCharacterId: sigrid.id,
    });

    const live = await db.query.bastions.findMany({
      where: isNull(schema.bastions.deletedAt),
    });
    expect(
      live.find(({ ownerCharacterId }) => ownerCharacterId === fighter.id),
    ).toMatchObject({ isArmoryStocked: true, hasGuestMonster: false });
    expect(
      live.find(({ ownerCharacterId }) => ownerCharacterId === sigrid.id),
    ).toMatchObject({ isArmoryStocked: false, hasGuestMonster: true });
  });

  it('gives the keeper what a removed member held, not a bastion of their own', async () => {
    const sigrid = await addCharacter(9);
    const wizard = await addCharacter(5);
    await caller.bastions.setMode({ mode: 'party', name: 'Unused' });
    const hall = await caller.bastions.found({
      mode: 'party',
      name: 'The Hall',
      members: [
        { characterId: sigrid.id, ...rooms },
        { characterId: wizard.id, ...rooms },
      ],
    });
    await caller.bastions.addSpecialFacility({
      bastionId: hall.id,
      facilityKey: 'arcane-study',
      holderCharacterId: wizard.id,
    });
    await caller.characters.remove({ id: wizard.id });

    await caller.bastions.setMode({
      mode: 'per-character',
      keeperCharacterId: sigrid.id,
    });

    const list = await caller.bastions.list();
    expect(list.map(row => row.ownerId)).toEqual([sigrid.id]);
    const kept = await caller.bastions.get({ id: list[0]!.id });
    expect(
      kept.specialFacilities.map(facility => [
        facility.name,
        facility.holder?.id,
      ]),
    ).toEqual([['Arcane Study', sigrid.id]]);
    expect(kept.basicFacilities).toHaveLength(4);
  });
});
