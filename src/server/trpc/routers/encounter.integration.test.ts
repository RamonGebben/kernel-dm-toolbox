import { beforeEach, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '~/server/db/schema';
import { combatants, creatures } from '~/server/db/schema';
import type { Database } from '~/server/db';
import { appRouter } from '~/server/trpc/routers/_app';
import { createCallerFactory } from '~/server/trpc/init';

const createCaller = createCallerFactory(appRouter);

let db: Database;
let caller: ReturnType<typeof createCaller>;

/** A goblin and a dragon, enough to exercise naming and ordering. */
const seedLibrary = async () => {
  await db.insert(creatures).values([
    {
      slug: 'srd-2024_goblin',
      document: 'srd-2024',
      name: 'Goblin',
      size: 'small',
      type: 'humanoid',
      category: 'Monsters',
      alignment: 'chaotic neutral',
      challengeRating: 0.125,
      armorClass: 15,
      hitPoints: 7,
      hitDice: '2d6',
      initiativeBonus: 2,
      abilityScoreStrength: 8,
      abilityScoreDexterity: 15,
      abilityScoreConstitution: 10,
      abilityScoreIntelligence: 10,
      abilityScoreWisdom: 8,
      abilityScoreCharisma: 8,
      passivePerception: 9,
    },
    {
      slug: 'srd-2024_young-black-dragon',
      document: 'srd-2024',
      name: 'Young Black Dragon',
      size: 'large',
      type: 'dragon',
      category: 'Monsters',
      alignment: 'chaotic evil',
      challengeRating: 7,
      armorClass: 18,
      hitPoints: 127,
      hitDice: '15d10 + 45',
      initiativeBonus: 5,
      abilityScoreStrength: 19,
      abilityScoreDexterity: 14,
      abilityScoreConstitution: 17,
      abilityScoreIntelligence: 12,
      abilityScoreWisdom: 11,
      abilityScoreCharisma: 15,
      passivePerception: 16,
    },
  ]);
};

const addCharacter = async (name: string, maxHitPoints = 45) =>
  caller.characters.create({ name, armorClass: 20, maxHitPoints, level: 5 });

beforeEach(async () => {
  const client = createClient({ url: ':memory:' });
  db = drizzle(client, { schema }) as Database;
  await migrate(db, { migrationsFolder: 'src/server/db/migrations' });

  caller = createCaller({
    db,
    headers: new Headers(),
    campaignName: 'Test Campaign',
  });

  await seedLibrary();
});

describe('encounter.get', () => {
  it('works before anything has been added, creating the encounter lazily', async () => {
    const state = await caller.encounter.get();

    expect(state).toEqual({
      roundNumber: 0,
      activeCombatantId: null,
      combatants: [],
    });
  });
});

describe('encounter.addCreature', () => {
  it('adds one unnumbered monster', async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin' });

    const { combatants: rows } = await caller.encounter.get();
    expect(rows).toHaveLength(1);
    expect(rows[0].displayName).toBe('Goblin');
  });

  it('gives four goblins four numbered rows with their own hit points', async () => {
    await caller.encounter.addCreature({
      slug: 'srd-2024_goblin',
      count: 4,
    });

    const { combatants: rows } = await caller.encounter.get();

    expect(rows.map(row => row.displayName).toSorted()).toEqual([
      'Goblin 1',
      'Goblin 2',
      'Goblin 3',
      'Goblin 4',
    ]);
    expect(new Set(rows.map(row => row.id)).size).toBe(4);
    expect(rows.every(row => row.maxHitPoints === 7)).toBe(true);
  });

  it('continues numbering when more of the same arrive later', async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin', count: 2 });
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin' });

    const { combatants: rows } = await caller.encounter.get();

    expect(rows.map(row => row.displayName).toSorted()).toEqual([
      'Goblin 1',
      'Goblin 2',
      'Goblin 3',
    ]);
  });

  it('starts each monster at the book average hit points', async () => {
    await caller.encounter.addCreature({
      slug: 'srd-2024_young-black-dragon',
    });

    const [dragon] = (await caller.encounter.get()).combatants;

    expect(dragon.maxHitPoints).toBe(127);
    expect(dragon.currentHitPoints).toBe(127);
    expect(dragon.armorClass).toBe(18);
  });

  it('rolls initiative in the range the die allows', async () => {
    await caller.encounter.addCreature({
      slug: 'srd-2024_young-black-dragon',
      count: 10,
    });

    const { combatants: rows } = await caller.encounter.get();

    // d20 + 5
    expect(rows.every(row => row.initiative >= 6 && row.initiative <= 25)).toBe(
      true,
    );
  });

  it('refuses a creature that is not in the library', async () => {
    await expect(
      caller.encounter.addCreature({ slug: 'srd-2024_tarrasque' }),
    ).rejects.toThrow(/not in the library/);
  });
});

describe('encounter.addCharacter', () => {
  it('adds a character at the initiative the player rolled', async () => {
    const sigrid = await addCharacter('Sigrid');

    await caller.encounter.addCharacter({
      playerCharacterId: sigrid.id,
      initiative: 10,
    });

    const [row] = (await caller.encounter.get()).combatants;
    expect(row).toMatchObject({
      displayName: 'Sigrid',
      initiative: 10,
      maxHitPoints: 45,
      isPlayerCharacter: true,
    });
  });

  it('refuses to add the same character twice', async () => {
    const sigrid = await addCharacter('Sigrid');
    await caller.encounter.addCharacter({
      playerCharacterId: sigrid.id,
      initiative: 10,
    });

    await expect(
      caller.encounter.addCharacter({
        playerCharacterId: sigrid.id,
        initiative: 12,
      }),
    ).rejects.toThrow(/already in the encounter/);
  });

  it('refuses a character who was removed from the roster', async () => {
    const doomed = await addCharacter('Doomed');
    await caller.characters.remove({ id: doomed.id });

    await expect(
      caller.encounter.addCharacter({
        playerCharacterId: doomed.id,
        initiative: 5,
      }),
    ).rejects.toThrow(/not on the roster/);
  });
});

describe('initiative ordering', () => {
  it('returns combatants highest initiative first', async () => {
    const sigrid = await addCharacter('Sigrid');
    const hammie = await addCharacter('Hammie', 37);
    await caller.encounter.addCharacter({
      playerCharacterId: sigrid.id,
      initiative: 10,
    });
    await caller.encounter.addCharacter({
      playerCharacterId: hammie.id,
      initiative: 5,
    });
    await caller.encounter.addCreature({
      slug: 'srd-2024_young-black-dragon',
    });
    const [dragon] = (await caller.encounter.get()).combatants.filter(
      row => row.creatureSlug !== null,
    );
    await caller.encounter.update({ id: dragon.id, initiative: 17 });

    const order = (await caller.encounter.get()).combatants;

    expect(order.map(row => row.displayName)).toEqual([
      'Young Black Dragon',
      'Sigrid',
      'Hammie',
    ]);
  });
});

describe('encounter.update', () => {
  it('renames a combatant without touching the library', async () => {
    await caller.encounter.addCreature({
      slug: 'srd-2024_young-black-dragon',
    });
    const [dragon] = (await caller.encounter.get()).combatants;

    await caller.encounter.update({ id: dragon.id, displayName: 'Meat' });

    const [renamed] = (await caller.encounter.get()).combatants;
    expect(renamed.displayName).toBe('Meat');

    const template = await db.query.creatures.findFirst({
      where: eq(creatures.slug, 'srd-2024_young-black-dragon'),
    });
    expect(template?.name).toBe('Young Black Dragon');
  });

  it('allows a custom max hit point total, as "Meat 35/52" needs', async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin' });
    const [goblin] = (await caller.encounter.get()).combatants;

    await caller.encounter.update({
      id: goblin.id,
      displayName: 'Meat',
      maxHitPoints: 52,
      currentHitPoints: 35,
    });

    const [meat] = (await caller.encounter.get()).combatants;
    expect(meat).toMatchObject({
      displayName: 'Meat',
      currentHitPoints: 35,
      maxHitPoints: 52,
      healthStatus: 'healthy',
    });
  });

  it('bumps the sync version on every edit', async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin' });
    const [goblin] = (await caller.encounter.get()).combatants;

    const updated = await caller.encounter.update({
      id: goblin.id,
      initiative: 19,
    });

    expect(updated?.version).toBe(2);
  });
});

describe('damage and healing', () => {
  const addGoblin = async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin' });
    const [goblin] = (await caller.encounter.get()).combatants;
    await caller.encounter.update({
      id: goblin.id,
      maxHitPoints: 52,
      currentHitPoints: 52,
    });
    return goblin.id;
  };

  it('applies damage and reports the health status the players see', async () => {
    const id = await addGoblin();

    await caller.encounter.damage({ id, amount: 30 });

    const [row] = (await caller.encounter.get()).combatants;
    expect(row.currentHitPoints).toBe(22);
    expect(row.healthStatus).toBe('bloodied');
  });

  it('floors at zero and reads as unconscious', async () => {
    const id = await addGoblin();

    await caller.encounter.damage({ id, amount: 500 });

    const [row] = (await caller.encounter.get()).combatants;
    expect(row.currentHitPoints).toBe(0);
    expect(row.healthStatus).toBe('unconscious');
  });

  it('spends temporary hit points first', async () => {
    const id = await addGoblin();
    await caller.encounter.grantTemporaryHitPoints({ id, amount: 10 });

    await caller.encounter.damage({ id, amount: 6 });

    const [row] = (await caller.encounter.get()).combatants;
    expect(row.temporaryHitPoints).toBe(4);
    expect(row.currentHitPoints).toBe(52);
  });

  it('heals but never above the maximum', async () => {
    const id = await addGoblin();
    await caller.encounter.damage({ id, amount: 40 });

    await caller.encounter.heal({ id, amount: 100 });

    const [row] = (await caller.encounter.get()).combatants;
    expect(row.currentHitPoints).toBe(52);
  });

  it('refuses to damage a combatant that has been removed', async () => {
    const id = await addGoblin();
    await caller.encounter.remove({ id });

    await expect(caller.encounter.damage({ id, amount: 5 })).rejects.toThrow(
      /no longer in the encounter/,
    );
  });
});

describe('encounter.remove', () => {
  it('takes the combatant out of the order', async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin', count: 2 });
    const [first] = (await caller.encounter.get()).combatants;

    await caller.encounter.remove({ id: first.id });

    const { combatants: rows } = await caller.encounter.get();
    expect(rows).toHaveLength(1);
    expect(rows.map(row => row.id)).not.toContain(first.id);
  });

  it('tombstones rather than deleting the row', async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin' });
    const [goblin] = (await caller.encounter.get()).combatants;

    await caller.encounter.remove({ id: goblin.id });

    const row = await db.query.combatants.findFirst({
      where: eq(combatants.id, goblin.id),
    });
    expect(row?.deletedAt).toBeInstanceOf(Date);
  });
});

describe('encounter.clearNonPlayerCombatants', () => {
  it('removes the monsters and leaves the party', async () => {
    const sigrid = await addCharacter('Sigrid');
    await caller.encounter.addCharacter({
      playerCharacterId: sigrid.id,
      initiative: 10,
    });
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin', count: 3 });

    const result = await caller.encounter.clearNonPlayerCombatants();

    expect(result.removedCount).toBe(3);
    const { combatants: rows } = await caller.encounter.get();
    expect(rows.map(row => row.displayName)).toEqual(['Sigrid']);
  });

  it('keeps the character on the roster, not just in the encounter', async () => {
    const sigrid = await addCharacter('Sigrid');
    await caller.encounter.addCharacter({
      playerCharacterId: sigrid.id,
      initiative: 10,
    });

    await caller.encounter.clearNonPlayerCombatants();

    expect((await caller.characters.list()).map(c => c.name)).toEqual([
      'Sigrid',
    ]);
  });

  it('resets the round and the turn pointer', async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin' });

    await caller.encounter.clearNonPlayerCombatants();

    const state = await caller.encounter.get();
    expect(state.roundNumber).toBe(0);
    expect(state.activeCombatantId).toBeNull();
  });

  it('is safe to run on an empty encounter', async () => {
    const result = await caller.encounter.clearNonPlayerCombatants();

    expect(result.removedCount).toBe(0);
  });

  it('lets the same character be re-added to the next fight', async () => {
    const sigrid = await addCharacter('Sigrid');
    await caller.encounter.addCharacter({
      playerCharacterId: sigrid.id,
      initiative: 10,
    });
    await caller.encounter.remove({
      id: (await caller.encounter.get()).combatants[0].id,
    });

    await expect(
      caller.encounter.addCharacter({
        playerCharacterId: sigrid.id,
        initiative: 14,
      }),
    ).resolves.toMatchObject({ initiative: 14 });
  });
});
