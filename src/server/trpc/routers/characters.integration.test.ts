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
