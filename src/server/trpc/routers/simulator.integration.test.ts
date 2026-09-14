import { beforeEach, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '~/server/db/schema';
import { creatures } from '~/server/db/schema';
import type { Database } from '~/server/db';
import { appRouter } from '~/server/trpc/routers/_app';
import { createCallerFactory } from '~/server/trpc/init';

const createCaller = createCallerFactory(appRouter);

let db: Database;
let caller: ReturnType<typeof createCaller>;

const seedLibrary = async () => {
  await db.insert(creatures).values({
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
  });
};

const createCharacter = () =>
  caller.characters.create({
    name: 'Ari',
    armorClass: 16,
    maxHitPoints: 30,
    level: 4,
  });

const createScenario = () => caller.simulator.create({ name: 'Bridge ambush' });

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

describe('simulator scenario CRUD', () => {
  it('creates, lists and removes a scenario', async () => {
    const created = await createScenario();
    expect(created.name).toBe('Bridge ambush');

    const listed = await caller.simulator.list();
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      id: created.id,
      partyCount: 0,
      monsterCount: 0,
    });

    await caller.simulator.remove({ id: created.id });
    expect(await caller.simulator.list()).toHaveLength(0);
  });

  it('updates name, note and trial count', async () => {
    const created = await createScenario();

    const updated = await caller.simulator.update({
      id: created.id,
      name: 'Renamed ambush',
      note: 'Now with a bridge troll',
      trialCount: 500,
    });

    expect(updated).toMatchObject({
      name: 'Renamed ambush',
      note: 'Now with a bridge troll',
      trialCount: 500,
    });
  });

  it('rejects an update for a removed scenario', async () => {
    const created = await createScenario();
    await caller.simulator.remove({ id: created.id });

    await expect(
      caller.simulator.update({
        id: created.id,
        name: 'Still here?',
        trialCount: 100,
      }),
    ).rejects.toThrow();
  });
});

describe('simulator party membership', () => {
  it('adds, positions and removes a party member', async () => {
    const scenario = await createScenario();
    const character = await createCharacter();

    const member = await caller.simulator.addPartyMember({
      scenarioId: scenario.id,
      playerCharacterId: character.id,
    });

    let detail = await caller.simulator.get({ id: scenario.id });
    expect(detail.party).toHaveLength(1);
    expect(detail.party[0]).toMatchObject({
      playerCharacterId: character.id,
      name: 'Ari',
      position: null,
    });

    await caller.simulator.setPartyMemberPosition({
      id: member.id,
      position: { x: 2, y: 4 },
    });

    detail = await caller.simulator.get({ id: scenario.id });
    expect(detail.party[0]?.position).toEqual({ x: 2, y: 4 });

    await caller.simulator.removePartyMember({ id: member.id });
    detail = await caller.simulator.get({ id: scenario.id });
    expect(detail.party).toHaveLength(0);
  });

  it('rejects adding the same character to a scenario twice', async () => {
    const scenario = await createScenario();
    const character = await createCharacter();

    await caller.simulator.addPartyMember({
      scenarioId: scenario.id,
      playerCharacterId: character.id,
    });

    await expect(
      caller.simulator.addPartyMember({
        scenarioId: scenario.id,
        playerCharacterId: character.id,
      }),
    ).rejects.toThrow();
  });
});

describe('simulator monster entries', () => {
  it('adds, counts, positions and removes a monster entry', async () => {
    const scenario = await createScenario();

    const entry = await caller.simulator.addMonsterEntry({
      scenarioId: scenario.id,
      creatureSlug: 'srd-2024_goblin',
      count: 3,
    });

    let detail = await caller.simulator.get({ id: scenario.id });
    expect(detail.monsters).toHaveLength(1);
    expect(detail.monsters[0]).toMatchObject({
      name: 'Goblin',
      count: 3,
      position: null,
    });

    await caller.simulator.updateMonsterEntryCount({
      id: entry.id,
      count: 5,
    });
    await caller.simulator.setMonsterEntryPosition({
      id: entry.id,
      position: { x: 9, y: 4 },
    });

    detail = await caller.simulator.get({ id: scenario.id });
    expect(detail.monsters[0]).toMatchObject({
      count: 5,
      position: { x: 9, y: 4 },
    });

    const list = await caller.simulator.list();
    expect(list[0]).toMatchObject({ monsterCount: 5 });

    await caller.simulator.removeMonsterEntry({ id: entry.id });
    detail = await caller.simulator.get({ id: scenario.id });
    expect(detail.monsters).toHaveLength(0);
  });

  it('rejects a monster entry with both or neither source set', async () => {
    const scenario = await createScenario();

    await expect(
      caller.simulator.addMonsterEntry({
        scenarioId: scenario.id,
        creatureSlug: 'srd-2024_goblin',
        customCreatureId: crypto.randomUUID(),
        count: 1,
      }),
    ).rejects.toThrow();

    await expect(
      caller.simulator.addMonsterEntry({ scenarioId: scenario.id, count: 1 }),
    ).rejects.toThrow();
  });

  it('rejects a monster entry referencing a creature that does not exist', async () => {
    const scenario = await createScenario();

    await expect(
      caller.simulator.addMonsterEntry({
        scenarioId: scenario.id,
        creatureSlug: 'srd-2024_does-not-exist',
        count: 1,
      }),
    ).rejects.toThrow();
  });

  it('drops a monster entry from get() once its creature is gone', async () => {
    const scenario = await createScenario();
    const customCreature = await caller.customCreatures.create({
      name: 'Swamp Lurker',
      size: 'Large',
      type: 'monstrosity',
      alignment: 'unaligned',
      challengeRating: 3,
      armorClass: 13,
      hitPoints: 45,
      hitDice: '6d10 + 12',
      abilityScoreStrength: 16,
      abilityScoreDexterity: 12,
      abilityScoreConstitution: 15,
      abilityScoreIntelligence: 4,
      abilityScoreWisdom: 10,
      abilityScoreCharisma: 5,
      passivePerception: 10,
    });

    await caller.simulator.addMonsterEntry({
      scenarioId: scenario.id,
      customCreatureId: customCreature.id,
      count: 1,
    });

    await caller.customCreatures.remove({ id: customCreature.id });

    const detail = await caller.simulator.get({ id: scenario.id });
    expect(detail.monsters).toHaveLength(0);
  });
});

describe('simulator.runBatch', () => {
  it('rejects a run with no monsters or no party', async () => {
    const scenario = await createScenario();
    const character = await createCharacter();

    await expect(
      caller.simulator.runBatch({ scenarioId: scenario.id }),
    ).rejects.toThrow();

    await caller.simulator.addPartyMember({
      scenarioId: scenario.id,
      playerCharacterId: character.id,
    });

    // Still no monsters.
    await expect(
      caller.simulator.runBatch({ scenarioId: scenario.id }),
    ).rejects.toThrow();
  });

  it('runs a batch, aggregates results and persists the summary', async () => {
    const scenario = await createScenario();
    const character = await createCharacter();

    await caller.simulator.addPartyMember({
      scenarioId: scenario.id,
      playerCharacterId: character.id,
    });
    await caller.simulator.addMonsterEntry({
      scenarioId: scenario.id,
      creatureSlug: 'srd-2024_goblin',
      count: 2,
    });

    // Neither side has any actions in this fixture, so every trial runs to
    // the engine's max-round cap and draws — a deterministic outcome that
    // makes the aggregate easy to assert on exactly.
    const updated = await caller.simulator.runBatch({
      scenarioId: scenario.id,
      trialCount: 5,
      seed: 123,
    });

    expect(updated.lastRunAt).not.toBeNull();
    expect(updated.lastRunSummary).toMatchObject({
      trialCount: 5,
      baseSeed: 123,
      partyWinRate: 0,
      monsterWinRate: 0,
      drawRate: 1,
    });
    expect(updated.lastRunSummary?.combatants).toHaveLength(2);
    const goblins = updated.lastRunSummary?.combatants.find(
      c => c.side === 'monsters',
    );
    expect(goblins).toMatchObject({
      name: 'Goblin',
      survivalRate: 1,
      averageDamageDealt: 0,
      averageDamageTaken: 0,
      killRate: 0,
    });

    const persisted = await caller.simulator.get({ id: scenario.id });
    expect(persisted.scenario.lastRunSummary).toMatchObject({
      trialCount: 5,
      baseSeed: 123,
    });
  });

  it('defaults trialCount and seed when omitted', async () => {
    const scenario = await createScenario();
    const character = await createCharacter();

    await caller.simulator.addPartyMember({
      scenarioId: scenario.id,
      playerCharacterId: character.id,
    });
    await caller.simulator.addMonsterEntry({
      scenarioId: scenario.id,
      creatureSlug: 'srd-2024_goblin',
      count: 1,
    });

    const updated = await caller.simulator.runBatch({
      scenarioId: scenario.id,
    });

    // `simulatorScenarios.trialCount` defaults to 100.
    expect(updated.lastRunSummary).toMatchObject({ trialCount: 100 });
    expect(typeof updated.lastRunSummary?.baseSeed).toBe('number');
  });
});
