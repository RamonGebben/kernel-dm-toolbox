import { beforeEach, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '~/server/db/schema';
import { creatures } from '~/server/db/schema';
import type { Database } from '~/server/db';
import { appRouter } from '~/server/trpc/routers/_app';
import { createCallerFactory } from '~/server/trpc/init';

/**
 * `library.listCreatures`'s merge of the read-only library with the DM's own
 * custom creatures (issue #3), against a real database.
 */
const createCaller = createCallerFactory(appRouter);

let db: Database;
let caller: ReturnType<typeof createCaller>;

const seedGoblin = () =>
  db.insert(creatures).values({
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

const customGoblinBoss = {
  name: 'Goblin Boss',
  size: 'small',
  type: 'humanoid',
  alignment: 'neutral evil',
  challengeRating: 1,
  armorClass: 17,
  hitPoints: 21,
  hitDice: '6d6',
  abilityScoreStrength: 10,
  abilityScoreDexterity: 14,
  abilityScoreConstitution: 10,
  abilityScoreIntelligence: 10,
  abilityScoreWisdom: 9,
  abilityScoreCharisma: 10,
  passivePerception: 10,
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

  await seedGoblin();
  await caller.customCreatures.create(customGoblinBoss);
});

describe('library.listCreatures source merge', () => {
  it('defaults to merging both sources, sorted by name', async () => {
    const rows = await caller.library.listCreatures({ search: '' });

    expect(rows.map(row => ({ name: row.name, source: row.source }))).toEqual([
      { name: 'Goblin', source: 'library' },
      { name: 'Goblin Boss', source: 'custom' },
    ]);
  });

  it('filters to library only', async () => {
    const rows = await caller.library.listCreatures({
      search: '',
      source: 'library',
    });

    expect(rows.map(row => row.source)).toEqual(['library']);
  });

  it('filters to custom only', async () => {
    const rows = await caller.library.listCreatures({
      search: '',
      source: 'custom',
    });

    expect(rows.map(row => row.source)).toEqual(['custom']);
  });

  it('excludes custom creatures when a category filter is active', async () => {
    const rows = await caller.library.listCreatures({
      search: '',
      category: 'Monsters',
    });

    expect(rows.map(row => row.source)).toEqual(['library']);
  });

  it('excludes a removed custom creature', async () => {
    const [customRow] = await caller.library.listCreatures({
      search: '',
      source: 'custom',
    });

    if (customRow?.source !== 'custom') {
      throw new Error('expected a custom row from the seeded creature');
    }

    await caller.customCreatures.remove({ id: customRow.id });

    expect(
      await caller.library.listCreatures({ search: '', source: 'custom' }),
    ).toEqual([]);
  });
});

describe('library character classes (issue #5)', () => {
  beforeEach(async () => {
    await db.insert(schema.characterClasses).values([
      {
        slug: 'srd-2024_barbarian',
        document: 'srd-2024',
        name: 'Barbarian',
        hitDice: '1d12',
        casterType: 'NONE',
        primaryAbilities: ['strength'],
        savingThrows: ['strength', 'constitution'],
        subclassOfSlug: null,
      },
      {
        slug: 'srd-2024_berserker',
        document: 'srd-2024',
        name: 'Path of the Berserker',
        desc: 'A path of untamed fury.',
        casterType: 'NONE',
        primaryAbilities: [],
        savingThrows: [],
        subclassOfSlug: 'srd-2024_barbarian',
      },
    ]);

    await db.insert(schema.characterClassFeatures).values({
      slug: 'srd-2024_barbarian-rage',
      classSlug: 'srd-2024_barbarian',
      name: 'Rage',
      desc: 'In battle, you fight with primal ferocity.',
    });
  });

  it('lists every class and subclass in name order', async () => {
    const rows = await caller.library.listCharacterClasses();

    expect(rows.map(row => row.slug)).toEqual([
      'srd-2024_barbarian',
      'srd-2024_berserker',
    ]);
  });

  it('fetches one class with its features', async () => {
    const result = await caller.library.getCharacterClass({
      slug: 'srd-2024_barbarian',
    });

    expect(result?.characterClass.name).toBe('Barbarian');
    expect(result?.features.map(feature => feature.name)).toEqual(['Rage']);
  });

  it('returns null for a class that does not exist', async () => {
    expect(
      await caller.library.getCharacterClass({ slug: 'not-a-class' }),
    ).toBeNull();
  });
});
