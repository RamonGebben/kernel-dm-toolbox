import { beforeEach, describe, expect, it } from 'vitest';
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

    expect(detail.owner.name).toBe(owner.name);
    expect(
      detail.basicFacilities.map(({ type, space }) => [type, space]),
    ).toEqual([
      ['bedroom', 'cramped'],
      ['kitchen', 'roomy'],
    ]);
    expect(detail.allowance).toEqual({ held: 0, total: 2 });
    expect(await caller.party.get()).toEqual({ treasuryGold: 0 });
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
        ownerId: owner.id,
        ownerName: owner.name,
        ownerLevel: 9,
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
    expect(await caller.party.get()).toEqual({ treasuryGold: 4000 });
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
    expect(await caller.party.get()).toEqual({ treasuryGold: 400 });
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
    expect(await caller.party.get()).toEqual({ treasuryGold: 4500 });
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
    expect(await caller.party.get()).toEqual({ treasuryGold: 5000 });
  });

  it('builds walls onto the bastion', async () => {
    const bastion = await setUp();
    const project = await caller.bastions.startProject({
      bastionId: bastion.id,
      request: { kind: 'walls', squares: 4 },
    });

    await caller.bastions.finishProject({ id: project.id });

    expect((await caller.bastions.get({ id: bastion.id })).wallSquares).toBe(4);
    expect(await caller.party.get()).toEqual({ treasuryGold: 4000 });
  });

  it('cancelling refunds the treasury', async () => {
    const bastion = await setUp();
    const project = await caller.bastions.startProject({
      bastionId: bastion.id,
      request: { kind: 'add-basic', basicType: 'storage', space: 'vast' },
    });

    await caller.bastions.cancelProject({ id: project.id });

    expect(await caller.party.get()).toEqual({ treasuryGold: 5000 });
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

    expect(await caller.party.get()).toEqual({ treasuryGold: 5000 });
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
