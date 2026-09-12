import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '~/server/db/schema';
import type { Database } from '~/server/db';
import { importLibrary } from '~/server/library/importLibrary';
import type { FetchJson } from '~/server/library/source';
import type { FetchBinary } from '~/server/library/effectsSource';

/**
 * Exercises effect matching + downloading against a real (in-memory)
 * database and a real temp directory on disk — the network is stubbed, but
 * everything downstream of it (dedup, `spell_effects` rows, `import_runs`
 * reporting) is real.
 */

const fireball = {
  model: 'api_v2.spell',
  pk: 'srd-2024_fireball',
  fields: {
    name: 'Fireball',
    desc: 'A bright streak flashes.',
    document: 'srd-2024',
    level: 3,
    school: 'evocation',
    target_type: 'point',
    range_text: '150 feet',
    range: 150,
    range_unit: 'feet',
    ritual: false,
    casting_time: 'action',
    verbal: true,
    somatic: true,
    material: true,
    target_count: 0,
    saving_throw_ability: 'dexterity',
    attack_roll: false,
    damage_roll: '8d6',
    damage_types: ['fire'],
    duration: 'instantaneous',
    shape_type: 'sphere',
    shape_size: 20,
    shape_size_unit: 'feet',
    concentration: false,
    classes: ['srd-2024_wizard'],
  },
};

/** A second, distinct spell that matches the exact same (fire, circle)
 * clip — the case that proves dedup. */
const delayedBlastFireball = {
  model: 'api_v2.spell',
  pk: 'srd-2024_delayed-blast-fireball',
  fields: {
    name: 'Delayed Blast Fireball',
    desc: 'A beam of yellow light streaks.',
    document: 'srd-2024',
    level: 7,
    school: 'evocation',
    target_type: 'point',
    range_text: '150 feet',
    range: 150,
    range_unit: 'feet',
    ritual: false,
    casting_time: 'action',
    verbal: true,
    somatic: true,
    material: true,
    target_count: 0,
    saving_throw_ability: 'dexterity',
    attack_roll: false,
    damage_roll: '12d6',
    damage_types: ['fire'],
    duration: 'instantaneous',
    shape_type: 'sphere',
    shape_size: 20,
    shape_size_unit: 'feet',
    concentration: false,
    classes: ['srd-2024_wizard'],
  },
};

/** No damage type at all — must not match anything. */
const shield = {
  model: 'api_v2.spell',
  pk: 'srd-2024_shield',
  fields: {
    name: 'Shield',
    desc: 'An invisible barrier of magical force appears.',
    document: 'srd-2024',
    level: 1,
    school: 'abjuration',
    range_text: 'Self',
    range: 0,
    range_unit: null,
    ritual: false,
    casting_time: 'reaction',
    verbal: true,
    somatic: true,
    material: false,
    target_count: 0,
    saving_throw_ability: '',
    attack_roll: false,
    damage_types: [],
    duration: '1 round',
    shape_type: null,
    shape_size: null,
    shape_size_unit: null,
    concentration: false,
    classes: ['srd-2024_wizard'],
  },
};

const payloads: Record<string, unknown> = {
  Creature: [],
  CreatureAction: [],
  CreatureActionAttack: [],
  CreatureTrait: [],
  ConditionDescription: [],
  Spell: [fireball, delayedBlastFireball, shield],
  SpellCastingOption: [],
};

const stubFetchJson: FetchJson = async url => {
  const fileName = url.split('/').pop()?.replace('.json', '') ?? '';
  const payload = payloads[fileName];

  if (!payload) throw new Error(`Unexpected fixture request: ${url}`);
  return payload;
};

const fakeVideoBytes = new TextEncoder().encode('fake-webm-bytes').buffer;

let db: Database;
let storageDir: string;
let fetchedUrls: string[];

const stubFetchBinary: FetchBinary = async url => {
  fetchedUrls.push(url);
  return fakeVideoBytes;
};

beforeEach(async () => {
  const client = createClient({ url: ':memory:' });
  db = drizzle(client, { schema }) as Database;
  await migrate(db, { migrationsFolder: 'src/server/db/migrations' });
  storageDir = await mkdtemp(join(tmpdir(), 'spell-effects-'));
  fetchedUrls = [];
});

describe('importLibrary with effectsStorageDir', () => {
  it('matches shaped, damage-typed spells to an effect and writes the clip once', async () => {
    const result = await importLibrary({
      db,
      fetchJson: stubFetchJson,
      effectsStorageDir: storageDir,
      fetchBinary: stubFetchBinary,
    });

    // Both fireball spells match the same (fire, circle) clip.
    expect(result.effectCount).toBe(2);
    // But it's fetched from GitHub only once.
    expect(fetchedUrls).toHaveLength(1);
    expect(fetchedUrls[0]).toContain(
      'spell-effects/fire/fire_ball_CIRCLE_02.webm',
    );

    const rows = await db.query.spellEffects.findMany();
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map(row => row.storagePath)).size).toBe(1);

    const files = await readdir(storageDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/\.webm$/);

    const written = await readFile(join(storageDir, files[0]!));
    expect(written.toString()).toBe('fake-webm-bytes');
  });

  it('leaves a spell with no damage type unmatched', async () => {
    await importLibrary({
      db,
      fetchJson: stubFetchJson,
      effectsStorageDir: storageDir,
      fetchBinary: stubFetchBinary,
    });

    const shieldEffect = await db.query.spellEffects.findFirst({
      where: (fields, { eq }) => eq(fields.spellSlug, 'srd-2024_shield'),
    });
    expect(shieldEffect).toBeUndefined();
  });

  it('does not re-fetch a clip already on disk from a previous run', async () => {
    await importLibrary({
      db,
      fetchJson: stubFetchJson,
      effectsStorageDir: storageDir,
      fetchBinary: stubFetchBinary,
    });
    fetchedUrls = [];

    await importLibrary({
      db,
      fetchJson: stubFetchJson,
      effectsStorageDir: storageDir,
      fetchBinary: stubFetchBinary,
    });

    expect(fetchedUrls).toHaveLength(0);
  });

  it('skips effect matching entirely when effectsStorageDir is omitted', async () => {
    const result = await importLibrary({ db, fetchJson: stubFetchJson });

    expect(result.effectCount).toBe(0);
    expect(await db.query.spellEffects.findMany()).toHaveLength(0);
  });

  it('never fails the whole import when the effects fetch fails', async () => {
    const failingFetchBinary: FetchBinary = async () => {
      throw new Error('network down');
    };

    const result = await importLibrary({
      db,
      fetchJson: stubFetchJson,
      effectsStorageDir: storageDir,
      fetchBinary: failingFetchBinary,
    });

    // The text library still imported fine — both fireballs still counted
    // as *matched* (they did pick a candidate clip), even though neither
    // clip made it to disk, so no `spell_effects` row exists for either.
    expect(result.spellCount).toBe(3);
    expect(result.effectCount).toBe(2);
    expect(await db.query.spellEffects.findMany()).toHaveLength(0);
  });
});
