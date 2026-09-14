import { beforeEach, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '~/server/db/schema';
import { playerCharacters } from '~/server/db/schema';
import type { Database } from '~/server/db';
import { appRouter } from '~/server/trpc/routers/_app';
import { createCallerFactory } from '~/server/trpc/init';

/**
 * The characters router against a real database, driven through a tRPC caller
 * so the zod input schemas are exercised too.
 */
const createCaller = createCallerFactory(appRouter);

let db: Database;
let caller: ReturnType<typeof createCaller>;

const validCharacter = {
  name: 'Sigrid',
  playerName: 'Anna',
  armorClass: 20,
  maxHitPoints: 45,
  initiativeModifier: 2,
  level: 5,
};

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

describe('characters.create', () => {
  it('stores everything the tracker and the XP readout need', async () => {
    const created = await caller.characters.create(validCharacter);

    expect(created).toMatchObject({
      name: 'Sigrid',
      playerName: 'Anna',
      armorClass: 20,
      maxHitPoints: 45,
      initiativeModifier: 2,
      level: 5,
    });
  });

  it('gives every character syncMeta from the start', async () => {
    const created = await caller.characters.create(validCharacter);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.version).toBe(1);
    expect(created.deletedAt).toBeNull();
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  it('defaults the optional fields rather than demanding them', async () => {
    const created = await caller.characters.create({
      name: 'Hammie',
      armorClass: 19,
      maxHitPoints: 37,
    });

    expect(created.initiativeModifier).toBe(0);
    expect(created.level).toBe(1);
    expect(created.playerName).toBeNull();
  });

  it('rejects a blank name', async () => {
    await expect(
      caller.characters.create({ ...validCharacter, name: '   ' }),
    ).rejects.toThrow();
  });

  it('rejects a character with no hit points', async () => {
    await expect(
      caller.characters.create({ ...validCharacter, maxHitPoints: 0 }),
    ).rejects.toThrow();
  });
});

describe('characters.list', () => {
  it('returns characters in name order so the roster is stable', async () => {
    await caller.characters.create({ ...validCharacter, name: 'Sigrid' });
    await caller.characters.create({ ...validCharacter, name: 'Hammie' });

    const list = await caller.characters.list();

    expect(list.map(character => character.name)).toEqual(['Hammie', 'Sigrid']);
  });

  it('is empty before anything is added', async () => {
    expect(await caller.characters.list()).toEqual([]);
  });
});

describe('characters.update', () => {
  it('applies the change and bumps the sync version', async () => {
    const created = await caller.characters.create(validCharacter);

    const updated = await caller.characters.update({
      ...validCharacter,
      id: created.id,
      maxHitPoints: 52,
      level: 6,
    });

    expect(updated?.maxHitPoints).toBe(52);
    expect(updated?.level).toBe(6);
    expect(updated?.version).toBe(2);
  });

  it('moves updatedAt forward, which is what resolves conflicts', async () => {
    const created = await caller.characters.create(validCharacter);

    const updated = await caller.characters.update({
      ...validCharacter,
      id: created.id,
      name: 'Sigrid the Bold',
    });

    expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(
      created.updatedAt.getTime(),
    );
  });

  it('refuses to update a character that was removed', async () => {
    const created = await caller.characters.create(validCharacter);
    await caller.characters.remove({ id: created.id });

    await expect(
      caller.characters.update({ ...validCharacter, id: created.id }),
    ).rejects.toThrow(/no longer exists/);
  });
});

describe('characters.remove', () => {
  it('hides the character from the roster', async () => {
    const created = await caller.characters.create(validCharacter);

    await caller.characters.remove({ id: created.id });

    expect(await caller.characters.list()).toEqual([]);
  });

  it('tombstones rather than deleting — the row is still there', async () => {
    const created = await caller.characters.create(validCharacter);

    await caller.characters.remove({ id: created.id });

    const row = await db.query.playerCharacters.findFirst({
      where: eq(playerCharacters.id, created.id),
    });

    expect(row).toBeDefined();
    expect(row?.deletedAt).toBeInstanceOf(Date);
    expect(row?.name).toBe('Sigrid');
  });

  it('refuses to remove the same character twice', async () => {
    const created = await caller.characters.create(validCharacter);
    await caller.characters.remove({ id: created.id });

    await expect(caller.characters.remove({ id: created.id })).rejects.toThrow(
      /no longer exists/,
    );
  });
});

const seedBarbarian = async () =>
  db.insert(schema.characterClasses).values({
    slug: 'srd-2024_barbarian',
    document: 'srd-2024',
    name: 'Barbarian',
    hitDice: '1d12',
    casterType: 'NONE',
    primaryAbilities: ['strength'],
    savingThrows: ['strength', 'constitution'],
    subclassOfSlug: null,
  });

const seedBerserker = async () =>
  db.insert(schema.characterClasses).values({
    slug: 'srd-2024_berserker',
    document: 'srd-2024',
    name: 'Path of the Berserker',
    casterType: 'NONE',
    primaryAbilities: [],
    savingThrows: [],
    subclassOfSlug: 'srd-2024_barbarian',
  });

const seedWizard = async () =>
  db.insert(schema.characterClasses).values({
    slug: 'srd-2024_wizard',
    document: 'srd-2024',
    name: 'Wizard',
    hitDice: '1d6',
    casterType: 'FULL',
    primaryAbilities: ['intelligence'],
    savingThrows: ['intelligence', 'wisdom'],
    subclassOfSlug: null,
  });

describe('characters.applyClassTemplate', () => {
  it('writes the class fields onto the character', async () => {
    await seedBarbarian();
    const created = await caller.characters.create(validCharacter);

    const updated = await caller.characters.applyClassTemplate({
      id: created.id,
      characterClassSlug: 'srd-2024_barbarian',
      level: 3,
    });

    expect(updated?.characterClassSlug).toBe('srd-2024_barbarian');
    expect(updated?.subclassSlug).toBeNull();
    expect(updated?.level).toBe(3);
  });

  it('materializes resources from classProgression at the applied level', async () => {
    await seedBarbarian();
    const created = await caller.characters.create(validCharacter);

    await caller.characters.applyClassTemplate({
      id: created.id,
      characterClassSlug: 'srd-2024_barbarian',
      level: 3,
    });

    const combatData = await caller.characters.getCombatData({
      id: created.id,
    });

    expect(combatData.resources).toEqual([
      expect.objectContaining({
        resourceKey: 'rage',
        name: 'Rage',
        maxUses: 3,
        isUnlimited: false,
        resetsOn: 'LONG_REST',
      }),
    ]);
  });

  it('materializes spell slots for a full caster', async () => {
    await seedWizard();
    const created = await caller.characters.create(validCharacter);

    await caller.characters.applyClassTemplate({
      id: created.id,
      characterClassSlug: 'srd-2024_wizard',
      level: 3,
    });

    const combatData = await caller.characters.getCombatData({
      id: created.id,
    });

    expect(combatData.spellSlots).toEqual([
      expect.objectContaining({ spellLevel: 1, maxSlots: 4 }),
      expect.objectContaining({ spellLevel: 2, maxSlots: 2 }),
    ]);
  });

  it('accepts a subclass that belongs to the chosen class', async () => {
    await seedBarbarian();
    await seedBerserker();
    const created = await caller.characters.create(validCharacter);

    const updated = await caller.characters.applyClassTemplate({
      id: created.id,
      characterClassSlug: 'srd-2024_barbarian',
      subclassSlug: 'srd-2024_berserker',
      level: 3,
    });

    expect(updated?.subclassSlug).toBe('srd-2024_berserker');
  });

  it('rejects a subclass that belongs to a different class', async () => {
    await seedBarbarian();
    await seedWizard();
    const created = await caller.characters.create(validCharacter);

    await expect(
      caller.characters.applyClassTemplate({
        id: created.id,
        characterClassSlug: 'srd-2024_barbarian',
        subclassSlug: 'srd-2024_wizard',
        level: 3,
      }),
    ).rejects.toThrow(/does not belong/);
  });

  it('rejects a class that does not exist', async () => {
    const created = await caller.characters.create(validCharacter);

    await expect(
      caller.characters.applyClassTemplate({
        id: created.id,
        characterClassSlug: 'srd-2024_not-a-class',
        level: 1,
      }),
    ).rejects.toThrow(/does not exist/);
  });

  it('a re-apply wipes and regenerates the materialized rows rather than merging', async () => {
    await seedBarbarian();
    const created = await caller.characters.create(validCharacter);

    await caller.characters.applyClassTemplate({
      id: created.id,
      characterClassSlug: 'srd-2024_barbarian',
      level: 1,
    });

    await caller.characters.applyClassTemplate({
      id: created.id,
      characterClassSlug: 'srd-2024_barbarian',
      level: 3,
    });

    const combatData = await caller.characters.getCombatData({
      id: created.id,
    });

    // Only the level-3 Rage row survives — the level-1 row was tombstoned,
    // not left alongside it.
    expect(combatData.resources).toHaveLength(1);
    expect(combatData.resources[0]?.maxUses).toBe(3);
  });
});

describe('characters.updateCombatData', () => {
  it('replaces a PC action(+attack), spell, slot, and resource in one call', async () => {
    await seedWizard();
    await db.insert(schema.spells).values({
      slug: 'srd-2024_fire-bolt',
      document: 'srd-2024',
      name: 'Fire Bolt',
      desc: 'A mote of fire.',
      level: 0,
      school: 'evocation',
      castingTime: '1 action',
      duration: 'Instantaneous',
    });
    const created = await caller.characters.create(validCharacter);

    await caller.characters.updateCombatData({
      id: created.id,
      actions: [
        {
          name: 'Fire Bolt',
          desc: 'Ranged spell attack.',
          actionType: 'ACTION',
          attack: {
            name: 'Fire Bolt',
            attackType: 'Ranged Spell Attack',
            toHitMod: 5,
            range: 120,
            targetCreatureOnly: false,
            damageDieCount: 1,
            damageDieType: 'd10',
            damageType: 'fire',
          },
        },
      ],
      spells: [
        {
          spellSlug: 'srd-2024_fire-bolt',
          isPrepared: true,
          isAlwaysAvailable: true,
        },
      ],
      spellSlots: [{ spellLevel: 1, maxSlots: 4 }],
      resources: [],
    });

    const combatData = await caller.characters.getCombatData({
      id: created.id,
    });

    expect(combatData.actions).toHaveLength(1);
    expect(combatData.actions[0]?.attack).toMatchObject({
      name: 'Fire Bolt',
      damageDieType: 'd10',
    });
    expect(combatData.spells).toHaveLength(1);
    expect(combatData.spellSlots).toEqual([
      expect.objectContaining({ spellLevel: 1, maxSlots: 4 }),
    ]);
  });

  it('a second call replaces rather than appends', async () => {
    const created = await caller.characters.create(validCharacter);

    await caller.characters.updateCombatData({
      id: created.id,
      actions: [
        { name: 'Unarmed Strike', desc: 'A punch.', actionType: 'ACTION' },
      ],
      spells: [],
      spellSlots: [],
      resources: [],
    });

    await caller.characters.updateCombatData({
      id: created.id,
      actions: [
        { name: 'Dagger', desc: 'A thrown blade.', actionType: 'ACTION' },
      ],
      spells: [],
      spellSlots: [],
      resources: [],
    });

    const combatData = await caller.characters.getCombatData({
      id: created.id,
    });

    expect(combatData.actions.map(action => action.name)).toEqual(['Dagger']);
  });

  it('refuses to save combat data for a removed character', async () => {
    const created = await caller.characters.create(validCharacter);
    await caller.characters.remove({ id: created.id });

    await expect(
      caller.characters.updateCombatData({
        id: created.id,
        actions: [],
        spells: [],
        spellSlots: [],
        resources: [],
      }),
    ).rejects.toThrow(/no longer exists/);
  });
});
