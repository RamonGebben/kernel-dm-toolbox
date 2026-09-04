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
      slug: 'srd-2024_hobgoblin',
      document: 'srd-2024',
      name: 'Hobgoblin',
      size: 'medium',
      type: 'fey',
      category: 'Monsters',
      alignment: 'lawful evil',
      challengeRating: 0.5,
      armorClass: 18,
      hitPoints: 11,
      hitDice: '2d8 + 2',
      initiativeBonus: 1,
      abilityScoreStrength: 13,
      abilityScoreDexterity: 12,
      abilityScoreConstitution: 12,
      abilityScoreIntelligence: 10,
      abilityScoreWisdom: 10,
      abilityScoreCharisma: 9,
      passivePerception: 10,
    },
  ]);
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

  await seedLibrary();
});

const buildTheAmbush = async () => {
  await caller.encounter.addCreature({ slug: 'srd-2024_goblin', count: 4 });
  await caller.encounter.addCreature({ slug: 'srd-2024_hobgoblin' });
};

describe('presets.saveCurrent', () => {
  it('saves the monsters on the board as counts, not as rows', async () => {
    await buildTheAmbush();

    await caller.presets.saveCurrent({ name: 'Ambush at the bridge' });

    const [preset] = await caller.presets.list();
    expect(preset.name).toBe('Ambush at the bridge');
    expect(preset.creatureCount).toBe(5);
    expect(preset.entries).toEqual([
      expect.objectContaining({ name: 'Goblin', count: 4 }),
      expect.objectContaining({ name: 'Hobgoblin', count: 1 }),
    ]);
  });

  it('leaves the party out — a preset is the opposition', async () => {
    const character = await caller.characters.create({
      name: 'Sigrid',
      armorClass: 20,
      maxHitPoints: 45,
      level: 5,
    });
    await caller.encounter.addCharacter({
      playerCharacterId: character.id,
      initiative: 10,
    });
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin' });

    await caller.presets.saveCurrent({ name: 'One goblin' });

    const [preset] = await caller.presets.list();
    expect(preset.creatureCount).toBe(1);
    expect(preset.entries).toHaveLength(1);
  });

  it('refuses to save a board with no creatures on it', async () => {
    await expect(
      caller.presets.saveCurrent({ name: 'Nothing' }),
    ).rejects.toThrow(/no creatures/);
  });
});

describe('presets.addToEncounter', () => {
  it('drops the whole set onto an empty board', async () => {
    await buildTheAmbush();
    await caller.presets.saveCurrent({ name: 'Ambush at the bridge' });
    await caller.encounter.clearNonPlayerCombatants();

    const [preset] = await caller.presets.list();
    const result = await caller.presets.addToEncounter({ id: preset.id });

    expect(result.addedCount).toBe(5);

    const { combatants: rows } = await caller.encounter.get();
    expect(rows).toHaveLength(5);
    expect(
      rows.filter(row => row.displayName.startsWith('Goblin')),
    ).toHaveLength(4);
  });

  it('numbers around monsters already on the board', async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin', count: 2 });
    await caller.presets.saveCurrent({ name: 'Two goblins' });

    const [preset] = await caller.presets.list();
    await caller.presets.addToEncounter({ id: preset.id });

    const { combatants: rows } = await caller.encounter.get();
    const names = rows.map(row => row.displayName).sort();
    expect(new Set(names).size).toBe(4);
  });

  it('rolls fresh initiative rather than restoring a saved one', async () => {
    await caller.encounter.addCreature({ slug: 'srd-2024_goblin' });
    await caller.presets.saveCurrent({ name: 'One goblin' });

    const [preset] = await caller.presets.list();
    await caller.presets.addToEncounter({ id: preset.id });

    const { combatants: rows } = await caller.encounter.get();
    // A d20 plus 2, for every row, without exception.
    expect(rows.every(row => row.initiative >= 3 && row.initiative <= 22)).toBe(
      true,
    );
  });
});

describe('presets.remove', () => {
  it('soft-deletes, so the preset stops being listed', async () => {
    await buildTheAmbush();
    await caller.presets.saveCurrent({ name: 'Ambush at the bridge' });
    const [preset] = await caller.presets.list();

    await caller.presets.remove({ id: preset.id });

    expect(await caller.presets.list()).toEqual([]);
  });

  it('rejects a preset that is already gone', async () => {
    await buildTheAmbush();
    await caller.presets.saveCurrent({ name: 'Ambush at the bridge' });
    const [preset] = await caller.presets.list();
    await caller.presets.remove({ id: preset.id });

    await expect(caller.presets.remove({ id: preset.id })).rejects.toThrow(
      /no longer exists/,
    );
  });
});
