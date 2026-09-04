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

    expect(state).toMatchObject({
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

describe('turn tracking', () => {
  /** Three combatants at known, unambiguous initiatives. */
  const buildOrder = async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin', count: 3 });
    const rows = (await caller.encounter.get()).combatants;

    await caller.encounter.update({ id: rows[0].id, initiative: 20 });
    await caller.encounter.update({ id: rows[1].id, initiative: 15 });
    await caller.encounter.update({ id: rows[2].id, initiative: 10 });

    return (await caller.encounter.get()).combatants;
  };

  it('starts the fight at round one on the first combatant', async () => {
    const order = await buildOrder();

    const result = await caller.encounter.nextTurn();

    expect(result.roundNumber).toBe(1);
    expect(result.activeCombatantId).toBe(order[0].id);
  });

  it('walks down the order without advancing the round', async () => {
    const order = await buildOrder();
    await caller.encounter.nextTurn();

    const result = await caller.encounter.nextTurn();

    expect(result.activeCombatantId).toBe(order[1].id);
    expect(result.roundNumber).toBe(1);
  });

  it('advances the round when the order wraps', async () => {
    const order = await buildOrder();
    await caller.encounter.nextTurn();
    await caller.encounter.nextTurn();
    await caller.encounter.nextTurn();

    const result = await caller.encounter.nextTurn();

    expect(result.activeCombatantId).toBe(order[0].id);
    expect(result.roundNumber).toBe(2);
  });

  it('steps back through the order', async () => {
    const order = await buildOrder();
    await caller.encounter.nextTurn();
    await caller.encounter.nextTurn();

    const result = await caller.encounter.previousTurn();

    expect(result.activeCombatantId).toBe(order[0].id);
  });

  it('gives the round back when stepping past the top', async () => {
    await buildOrder();
    await caller.encounter.nextTurn();
    await caller.encounter.nextTurn();
    await caller.encounter.nextTurn();
    await caller.encounter.nextTurn();
    expect((await caller.encounter.get()).roundNumber).toBe(2);

    const result = await caller.encounter.previousTurn();

    expect(result.roundNumber).toBe(1);
  });

  it('persists whose turn it is', async () => {
    const order = await buildOrder();

    await caller.encounter.nextTurn();

    expect((await caller.encounter.get()).activeCombatantId).toBe(order[0].id);
  });

  it('does nothing in an empty encounter', async () => {
    const result = await caller.encounter.nextTurn();

    expect(result.activeCombatantId).toBeNull();
    expect(result.roundNumber).toBe(0);
  });

  it('recovers when the active combatant is removed mid-fight', async () => {
    const order = await buildOrder();
    await caller.encounter.nextTurn();

    await caller.encounter.remove({ id: order[0].id });

    const state = await caller.encounter.get();
    expect(state.activeCombatantId).toBeNull();

    const result = await caller.encounter.nextTurn();
    expect(result.activeCombatantId).toBe(order[1].id);
  });
});

describe('encounter.toggleDelay', () => {
  it('drops a delayed combatant to the bottom of the order', async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin', count: 2 });
    const rows = (await caller.encounter.get()).combatants;
    await caller.encounter.update({ id: rows[0].id, initiative: 20 });
    await caller.encounter.update({ id: rows[1].id, initiative: 10 });
    const [first] = (await caller.encounter.get()).combatants;

    await caller.encounter.toggleDelay({ id: first.id });

    const order = (await caller.encounter.get()).combatants;
    expect(order.at(-1)?.id).toBe(first.id);
    expect(order.at(-1)?.isDelayed).toBe(true);
  });

  it('skips a delayed combatant when advancing turns', async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin', count: 3 });
    const rows = (await caller.encounter.get()).combatants;
    await caller.encounter.update({ id: rows[0].id, initiative: 20 });
    await caller.encounter.update({ id: rows[1].id, initiative: 15 });
    await caller.encounter.update({ id: rows[2].id, initiative: 10 });
    const order = (await caller.encounter.get()).combatants;
    await caller.encounter.toggleDelay({ id: order[1].id });

    await caller.encounter.nextTurn();
    const second = await caller.encounter.nextTurn();

    expect(second.activeCombatantId).toBe(order[2].id);
  });

  it('leaves initiative untouched, so undoing is free', async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin' });
    const [goblin] = (await caller.encounter.get()).combatants;
    await caller.encounter.update({ id: goblin.id, initiative: 20 });

    await caller.encounter.toggleDelay({ id: goblin.id });
    await caller.encounter.toggleDelay({ id: goblin.id });

    const [restored] = (await caller.encounter.get()).combatants;
    expect(restored.isDelayed).toBe(false);
    expect(restored.initiative).toBe(20);
  });

  it('gives up the turn when the active combatant delays', async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin', count: 2 });
    await caller.encounter.nextTurn();
    const active = (await caller.encounter.get()).activeCombatantId!;

    await caller.encounter.toggleDelay({ id: active });

    expect((await caller.encounter.get()).activeCombatantId).toBeNull();
  });
});

describe('conditions', () => {
  /** The library import supplies these; the tests seed the two they use. */
  const seedConditions = async () => {
    await db.insert(schema.conditions).values([
      {
        slug: 'srd-2024_poisoned',
        key: 'poisoned',
        name: 'Poisoned',
        desc: 'Disadvantage on attack rolls and ability checks.',
      },
      {
        slug: 'srd-2024_prone',
        key: 'prone',
        name: 'Prone',
        desc: 'Movement is restricted to crawling.',
      },
    ]);
  };

  const addGoblin = async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin' });
    const [goblin] = (await caller.encounter.get()).combatants;
    return goblin.id;
  };

  beforeEach(seedConditions);

  it('applies a condition with a countdown', async () => {
    const combatantId = await addGoblin();

    await caller.encounter.addCondition({
      combatantId,
      conditionSlug: 'srd-2024_poisoned',
      roundsRemaining: 3,
    });

    const [goblin] = (await caller.encounter.get()).combatants;
    expect(goblin.conditions).toEqual([
      expect.objectContaining({
        conditionSlug: 'srd-2024_poisoned',
        name: 'Poisoned',
        roundsRemaining: 3,
      }),
    ]);
  });

  it('applies an indefinite condition when no duration is given', async () => {
    const combatantId = await addGoblin();

    await caller.encounter.addCondition({
      combatantId,
      conditionSlug: 'srd-2024_prone',
    });

    const [goblin] = (await caller.encounter.get()).combatants;
    expect(goblin.conditions[0].roundsRemaining).toBeNull();
  });

  it('refreshes a duplicate rather than stacking a second copy', async () => {
    const combatantId = await addGoblin();
    await caller.encounter.addCondition({
      combatantId,
      conditionSlug: 'srd-2024_poisoned',
      roundsRemaining: 2,
    });

    await caller.encounter.addCondition({
      combatantId,
      conditionSlug: 'srd-2024_poisoned',
      roundsRemaining: 5,
    });

    const [goblin] = (await caller.encounter.get()).combatants;
    expect(goblin.conditions).toHaveLength(1);
    expect(goblin.conditions[0].roundsRemaining).toBe(5);
  });

  it('stores a free-text note alongside the condition', async () => {
    const combatantId = await addGoblin();

    await caller.encounter.addCondition({
      combatantId,
      conditionSlug: 'srd-2024_poisoned',
      note: 'concentrating on Hold Person',
    });

    const [goblin] = (await caller.encounter.get()).combatants;
    expect(goblin.conditions[0].note).toBe('concentrating on Hold Person');
  });

  it('counts a duration down when the round advances', async () => {
    const combatantId = await addGoblin();
    await caller.encounter.addCondition({
      combatantId,
      conditionSlug: 'srd-2024_poisoned',
      roundsRemaining: 3,
    });

    // Start the fight, then wrap the order to reach round two.
    await caller.encounter.nextTurn();
    await caller.encounter.nextTurn();

    const [goblin] = (await caller.encounter.get()).combatants;
    expect((await caller.encounter.get()).roundNumber).toBe(2);
    expect(goblin.conditions[0].roundsRemaining).toBe(2);
  });

  it('does not tick on the round that starts the fight', async () => {
    const combatantId = await addGoblin();
    await caller.encounter.addCondition({
      combatantId,
      conditionSlug: 'srd-2024_poisoned',
      roundsRemaining: 3,
    });

    await caller.encounter.nextTurn();

    const [goblin] = (await caller.encounter.get()).combatants;
    expect(goblin.conditions[0].roundsRemaining).toBe(3);
  });

  it('expires a condition automatically when its last round passes', async () => {
    const combatantId = await addGoblin();
    await caller.encounter.addCondition({
      combatantId,
      conditionSlug: 'srd-2024_poisoned',
      roundsRemaining: 1,
    });

    await caller.encounter.nextTurn();
    await caller.encounter.nextTurn();

    const [goblin] = (await caller.encounter.get()).combatants;
    expect(goblin.conditions).toEqual([]);
  });

  it('leaves an indefinite condition alone across rounds', async () => {
    const combatantId = await addGoblin();
    await caller.encounter.addCondition({
      combatantId,
      conditionSlug: 'srd-2024_prone',
    });

    await caller.encounter.nextTurn();
    await caller.encounter.nextTurn();
    await caller.encounter.nextTurn();

    const [goblin] = (await caller.encounter.get()).combatants;
    expect(goblin.conditions).toHaveLength(1);
  });

  it('removes a condition on request', async () => {
    const combatantId = await addGoblin();
    await caller.encounter.addCondition({
      combatantId,
      conditionSlug: 'srd-2024_prone',
    });
    const [before] = (await caller.encounter.get()).combatants;

    await caller.encounter.removeCondition({ id: before.conditions[0].id });

    const [after] = (await caller.encounter.get()).combatants;
    expect(after.conditions).toEqual([]);
  });

  it('refuses a condition that is not in the library', async () => {
    const combatantId = await addGoblin();

    await expect(
      caller.encounter.addCondition({
        combatantId,
        conditionSlug: 'srd-2024_hangry',
      }),
    ).rejects.toThrow(/not in the library/);
  });

  it('refuses to apply a condition to a combatant that has left', async () => {
    const combatantId = await addGoblin();
    await caller.encounter.remove({ id: combatantId });

    await expect(
      caller.encounter.addCondition({
        combatantId,
        conditionSlug: 'srd-2024_prone',
      }),
    ).rejects.toThrow(/no longer in the encounter/);
  });
});

describe('encounter difficulty', () => {
  it('is trivial with nothing in the fight', async () => {
    const { difficulty } = await caller.encounter.get();

    expect(difficulty).toMatchObject({
      totalExperience: 0,
      difficulty: 'trivial',
      hasParty: false,
    });
  });

  it('reports no party when only monsters are present', async () => {
    await caller.encounter.addCreature({
      slug: 'srd-2024_young-black-dragon',
    });

    const { difficulty } = await caller.encounter.get();

    expect(difficulty.hasParty).toBe(false);
    expect(difficulty.totalExperience).toBe(2900);
  });

  it('rates a CR 7 dragon against four level fives', async () => {
    for (const name of ['Sigrid', 'Hammie', 'Meat', 'Bo']) {
      const character = await caller.characters.create({
        name,
        armorClass: 18,
        maxHitPoints: 40,
        level: 5,
      });
      await caller.encounter.addCharacter({
        playerCharacterId: character.id,
        initiative: 10,
      });
    }
    await caller.encounter.addCreature({
      slug: 'srd-2024_young-black-dragon',
    });

    const { difficulty } = await caller.encounter.get();

    expect(difficulty).toMatchObject({
      totalExperience: 2900,
      budget: { low: 2000, moderate: 3000, high: 4400 },
      difficulty: 'moderate',
      hasParty: true,
    });
  });

  it('rises as more monsters join', async () => {
    const character = await caller.characters.create({
      name: 'Solo',
      armorClass: 18,
      maxHitPoints: 40,
      level: 5,
    });
    await caller.encounter.addCharacter({
      playerCharacterId: character.id,
      initiative: 10,
    });

    await caller.encounter.addCreature({ slug: 'srd-2024_goblin' });
    const easy = (await caller.encounter.get()).difficulty.difficulty;

    await caller.encounter.addCreature({
      slug: 'srd-2024_young-black-dragon',
    });
    const hard = (await caller.encounter.get()).difficulty;

    expect(easy).toBe('low');
    expect(hard.difficulty).toBe('deadly');
  });

  it('falls again when the monsters are cleared', async () => {
    const character = await caller.characters.create({
      name: 'Solo',
      armorClass: 18,
      maxHitPoints: 40,
      level: 5,
    });
    await caller.encounter.addCharacter({
      playerCharacterId: character.id,
      initiative: 10,
    });
    await caller.encounter.addCreature({
      slug: 'srd-2024_young-black-dragon',
    });

    await caller.encounter.clearNonPlayerCombatants();

    const { difficulty } = await caller.encounter.get();
    expect(difficulty.totalExperience).toBe(0);
    expect(difficulty.difficulty).toBe('trivial');
  });
});
