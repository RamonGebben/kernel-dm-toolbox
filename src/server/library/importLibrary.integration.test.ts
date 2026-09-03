import { beforeEach, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { sql } from 'drizzle-orm';
import * as schema from '~/server/db/schema';
import type { Database } from '~/server/db';
import { importLibrary } from '~/server/library/importLibrary';
import type { FetchJson } from '~/server/library/source';

/**
 * Exercises the import against a real (in-memory) database, which is the only
 * way to prove the things that matter about it: that the foreign keys line up,
 * that the upserts really are idempotent, and that a second run does not
 * duplicate a single row.
 *
 * The network is stubbed — this tests our pipeline, not Open5e's uptime.
 */

const aboleth = {
  model: 'api_v2.creature',
  pk: 'srd-2024_aboleth',
  fields: {
    name: 'Aboleth',
    document: 'srd-2024',
    size: 'large',
    type: 'aberration',
    category: 'Monsters',
    alignment: 'lawful evil',
    challenge_rating: '10.000',
    armor_class: 17,
    hit_points: 150,
    hit_dice: '20d10 + 40',
    initiative_bonus: 7,
    ability_score_strength: 21,
    ability_score_dexterity: 9,
    ability_score_constitution: 15,
    ability_score_intelligence: 18,
    ability_score_wisdom: 15,
    ability_score_charisma: 18,
    passive_perception: 20,
    condition_immunities: ['poisoned'],
    condition_immunities_display: 'poisoned',
  },
};

const tentacleAction = {
  model: 'api_v2.creatureaction',
  pk: 'srd-2024_aboleth_tentacle',
  fields: {
    name: 'Tentacle',
    desc: 'Melee attack.',
    parent: 'srd-2024_aboleth',
    action_type: 'ACTION',
    order_in_statblock: 1,
  },
};

/** Deliberately references a creature that is not in the payload. */
const orphanAction = {
  model: 'api_v2.creatureaction',
  pk: 'other-doc_wyvern_sting',
  fields: {
    name: 'Sting',
    desc: 'Melee attack.',
    parent: 'other-doc_wyvern',
    action_type: 'ACTION',
    order_in_statblock: 1,
  },
};

const tentacleAttack = {
  model: 'api_v2.creatureactionattack',
  pk: 'srd-2024_aboleth_tentacle_tentacle-attack',
  fields: {
    name: 'Tentacle attack',
    parent: 'srd-2024_aboleth_tentacle',
    attack_type: 'WEAPON',
    to_hit_mod: 9,
    reach: 15,
    damage_die_count: 2,
    damage_die_type: 'D6',
    damage_bonus: 5,
  },
};

const amphibiousTrait = {
  model: 'api_v2.creaturetrait',
  pk: 'srd-2024_aboleth_amphibious',
  fields: {
    name: 'Amphibious',
    desc: 'The aboleth can breathe air and water.',
    parent: 'srd-2024_aboleth',
  },
};

const blindedCondition = {
  model: 'api_v2.conditiondescription',
  pk: 'srd-2024_blinded',
  fields: {
    describes: 'blinded',
    desc: 'While you have the Blinded condition…',
    document: 'srd-2024',
  },
};

const payloads: Record<string, unknown[]> = {
  Creature: [aboleth],
  CreatureAction: [tentacleAction, orphanAction],
  CreatureActionAttack: [tentacleAttack],
  CreatureTrait: [amphibiousTrait],
  ConditionDescription: [blindedCondition],
};

const stubFetch: FetchJson = async url => {
  const fileName = url.split('/').pop()?.replace('.json', '') ?? '';
  const payload = payloads[fileName];

  if (!payload) throw new Error(`Unexpected fixture request: ${url}`);
  return payload;
};

const countRows = async (db: Database, table: string): Promise<number> => {
  const result = await db.get<{ n: number }>(
    sql.raw(`select count(*) as n from ${table}`),
  );
  return result?.n ?? 0;
};

let db: Database;

beforeEach(async () => {
  const client = createClient({ url: ':memory:' });
  db = drizzle(client, { schema }) as Database;
  await migrate(db, { migrationsFolder: 'src/server/db/migrations' });
});

describe('importLibrary', () => {
  it('writes every kind of row', async () => {
    const result = await importLibrary({ db, fetchJson: stubFetch });

    expect(result.creatureCount).toBe(1);
    expect(result.actionCount).toBe(1);
    expect(result.attackCount).toBe(1);
    expect(result.traitCount).toBe(1);
    expect(result.conditionCount).toBe(1);
  });

  it('skips rows whose parent is outside the imported document', async () => {
    const result = await importLibrary({ db, fetchJson: stubFetch });

    expect(result.orphanedActions).toBe(1);
    expect(await countRows(db, 'creature_actions')).toBe(1);
  });

  it('is idempotent — a second run changes no row counts', async () => {
    await importLibrary({ db, fetchJson: stubFetch });
    await importLibrary({ db, fetchJson: stubFetch });

    expect(await countRows(db, 'creatures')).toBe(1);
    expect(await countRows(db, 'creature_actions')).toBe(1);
    expect(await countRows(db, 'creature_action_attacks')).toBe(1);
    expect(await countRows(db, 'creature_traits')).toBe(1);
    expect(await countRows(db, 'conditions')).toBe(1);
  });

  it('refreshes changed fields on re-import rather than ignoring them', async () => {
    await importLibrary({ db, fetchJson: stubFetch });

    const corrected: FetchJson = async url =>
      url.includes('Creature.json')
        ? [{ ...aboleth, fields: { ...aboleth.fields, hit_points: 999 } }]
        : stubFetch(url);

    await importLibrary({ db, fetchJson: corrected });

    const row = await db.get<{ hit_points: number }>(
      sql.raw(
        "select hit_points from creatures where slug = 'srd-2024_aboleth'",
      ),
    );
    expect(row?.hit_points).toBe(999);
  });

  it('stores JSON list columns as arrays, not as strings', async () => {
    await importLibrary({ db, fetchJson: stubFetch });

    const creature = await db.query.creatures.findFirst();

    expect(creature?.conditionImmunities).toEqual(['poisoned']);
    expect(creature?.damageImmunities).toEqual([]);
  });

  it('derives a display name for a condition that has none upstream', async () => {
    await importLibrary({ db, fetchJson: stubFetch });

    const condition = await db.query.conditions.findFirst();

    expect(condition?.name).toBe('Blinded');
    expect(condition?.key).toBe('blinded');
  });

  it('records provenance for every run', async () => {
    await importLibrary({ db, gitRef: 'abc123', fetchJson: stubFetch });

    const run = await db.query.importRuns.findFirst();

    expect(run?.gitRef).toBe('abc123');
    expect(run?.creatureCount).toBe(1);
    expect(run?.finishedAt).toBeInstanceOf(Date);
    expect(run?.error).toBeNull();
  });

  it('records the failure on the run and rethrows when the fetch fails', async () => {
    const failing: FetchJson = async () => {
      throw new Error('502 Bad Gateway');
    };

    await expect(importLibrary({ db, fetchJson: failing })).rejects.toThrow(
      '502 Bad Gateway',
    );

    const run = await db.query.importRuns.findFirst();
    expect(run?.error).toBe('502 Bad Gateway');
    expect(run?.finishedAt).toBeInstanceOf(Date);
  });

  it('rejects a fixture whose shape has changed upstream', async () => {
    const malformed: FetchJson = async url =>
      url.includes('Creature.json')
        ? [{ ...aboleth, fields: { ...aboleth.fields, armor_class: 'AC 17' } }]
        : stubFetch(url);

    await expect(importLibrary({ db, fetchJson: malformed })).rejects.toThrow(
      /Creature\.json record 0/,
    );
  });
});
