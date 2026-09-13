import { beforeEach, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '~/server/db/schema';
import { customCreatures } from '~/server/db/schema';
import type { Database } from '~/server/db';
import { appRouter } from '~/server/trpc/routers/_app';
import { createCallerFactory } from '~/server/trpc/init';

/**
 * The customCreatures router against a real database, driven through a tRPC
 * caller so the zod input schemas are exercised too (issue #3).
 */
const createCaller = createCallerFactory(appRouter);

let db: Database;
let caller: ReturnType<typeof createCaller>;

const goblinBoss = {
  name: 'Goblin Boss',
  size: 'small',
  type: 'humanoid',
  alignment: 'neutral evil',
  challengeRating: 1,
  armorClass: 17,
  armorDetail: 'chain shirt, shield',
  hitPoints: 21,
  hitDice: '6d6',
  abilityScoreStrength: 10,
  abilityScoreDexterity: 14,
  abilityScoreConstitution: 10,
  abilityScoreIntelligence: 10,
  abilityScoreWisdom: 9,
  abilityScoreCharisma: 10,
  passivePerception: 10,
  traits: [{ name: 'Nimble Escape', desc: 'Can disengage or hide.' }],
  actions: [
    {
      name: 'Scimitar',
      desc: 'Melee weapon attack.',
      actionType: 'ACTION' as const,
      attack: {
        name: 'Scimitar',
        toHitMod: 4,
        damageDieCount: 1,
        damageDieType: 'd6',
        damageBonus: 2,
        damageType: 'slashing',
        targetCreatureOnly: false,
      },
    },
  ],
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

describe('customCreatures.create', () => {
  it('stores the curated fields and gives the row syncMeta', async () => {
    const created = await caller.customCreatures.create(goblinBoss);

    expect(created).toMatchObject({
      name: 'Goblin Boss',
      armorClass: 17,
      hitPoints: 21,
    });
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.version).toBe(1);
    expect(created.deletedAt).toBeNull();
  });

  it('rejects a challenge rating outside the fixed CR list', async () => {
    await expect(
      caller.customCreatures.create({ ...goblinBoss, challengeRating: 1.5 }),
    ).rejects.toThrow();
  });

  it('rejects a blank name', async () => {
    await expect(
      caller.customCreatures.create({ ...goblinBoss, name: '  ' }),
    ).rejects.toThrow();
  });
});

describe('customCreatures.get', () => {
  it('returns the same Statblock shape a library creature would', async () => {
    const created = await caller.customCreatures.create(goblinBoss);

    const statblock = await caller.customCreatures.get({ id: created.id });

    expect(statblock).toMatchObject({
      slug: created.id,
      name: 'Goblin Boss',
      subtitle: 'Small Humanoid, neutral evil',
      armorClass: 17,
      hitPoints: 21,
    });
    expect(statblock?.traits).toEqual([
      {
        slug: expect.any(String),
        name: 'Nimble Escape',
        desc: 'Can disengage or hide.',
      },
    ]);
    expect(statblock?.actionSections[0]?.actions[0]).toMatchObject({
      name: 'Scimitar',
    });
  });

  it('returns null for a creature that does not exist', async () => {
    expect(
      await caller.customCreatures.get({ id: crypto.randomUUID() }),
    ).toBeNull();
  });

  it('returns null once the creature is removed', async () => {
    const created = await caller.customCreatures.create(goblinBoss);
    await caller.customCreatures.remove({ id: created.id });

    expect(await caller.customCreatures.get({ id: created.id })).toBeNull();
  });
});

describe('customCreatures.getRaw', () => {
  it('returns real editable numbers, not display-ready prose', async () => {
    const created = await caller.customCreatures.create(goblinBoss);

    const raw = await caller.customCreatures.getRaw({ id: created.id });

    expect(raw?.customCreature.challengeRating).toBe(1);
    expect(raw?.customCreature.abilityScoreDexterity).toBe(14);
    expect(raw?.actions[0]?.attack).toMatchObject({
      toHitMod: 4,
      damageDieType: 'd6',
    });
  });
});

describe('customCreatures.list', () => {
  it('returns live creatures in name order', async () => {
    await caller.customCreatures.create({ ...goblinBoss, name: 'Zomboid' });
    await caller.customCreatures.create({ ...goblinBoss, name: 'Aboleth Jr' });

    const list = await caller.customCreatures.list();

    expect(list.map(creature => creature.name)).toEqual([
      'Aboleth Jr',
      'Zomboid',
    ]);
  });

  it('excludes a removed creature', async () => {
    const created = await caller.customCreatures.create(goblinBoss);
    await caller.customCreatures.remove({ id: created.id });

    expect(await caller.customCreatures.list()).toEqual([]);
  });
});

describe('customCreatures.update', () => {
  it('applies changes and bumps the sync version', async () => {
    const created = await caller.customCreatures.create(goblinBoss);

    const updated = await caller.customCreatures.update({
      ...goblinBoss,
      id: created.id,
      hitPoints: 30,
    });

    expect(updated?.hitPoints).toBe(30);
    expect(updated?.version).toBe(2);
  });

  it('fully replaces traits and actions rather than accumulating them', async () => {
    const created = await caller.customCreatures.create(goblinBoss);

    await caller.customCreatures.update({
      ...goblinBoss,
      id: created.id,
      traits: [{ name: 'New Trait', desc: 'Replaced.' }],
      actions: [],
    });

    const statblock = await caller.customCreatures.get({ id: created.id });

    expect(statblock?.traits).toEqual([
      { slug: expect.any(String), name: 'New Trait', desc: 'Replaced.' },
    ]);
    expect(statblock?.actionSections).toEqual([]);
  });

  it('refuses to update a creature that was removed', async () => {
    const created = await caller.customCreatures.create(goblinBoss);
    await caller.customCreatures.remove({ id: created.id });

    await expect(
      caller.customCreatures.update({ ...goblinBoss, id: created.id }),
    ).rejects.toThrow(/no longer exists/);
  });
});

describe('customCreatures.remove', () => {
  it('tombstones rather than deleting — the row is still there', async () => {
    const created = await caller.customCreatures.create(goblinBoss);

    await caller.customCreatures.remove({ id: created.id });

    const row = await db.query.customCreatures.findFirst({
      where: eq(customCreatures.id, created.id),
    });

    expect(row).toBeDefined();
    expect(row?.deletedAt).toBeInstanceOf(Date);
    expect(row?.name).toBe('Goblin Boss');
  });

  it('refuses to remove the same creature twice', async () => {
    const created = await caller.customCreatures.create(goblinBoss);
    await caller.customCreatures.remove({ id: created.id });

    await expect(
      caller.customCreatures.remove({ id: created.id }),
    ).rejects.toThrow(/no longer exists/);
  });
});
