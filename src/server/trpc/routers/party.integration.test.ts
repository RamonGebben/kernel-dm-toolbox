import { beforeEach, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '~/server/db/schema';
import type { Database } from '~/server/db';
import { appRouter } from '~/server/trpc/routers/_app';
import { createCallerFactory } from '~/server/trpc/init';

/** The party's own state — the shared treasury — against a real database. */
const createCaller = createCallerFactory(appRouter);

let db: Database;
let caller: ReturnType<typeof createCaller>;

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

describe('party.get', () => {
  it('starts a fresh campaign with an empty treasury', async () => {
    expect(await caller.party.get()).toEqual({ treasuryGold: 0 });
  });

  it('creates the party row once, however often it is read', async () => {
    await caller.party.get();
    await caller.party.get();

    expect(await db.query.parties.findMany()).toHaveLength(1);
  });
});

describe('party.adjustTreasury', () => {
  it('deposits and withdraws', async () => {
    await caller.party.adjustTreasury({ delta: 500 });
    const after = await caller.party.adjustTreasury({ delta: -120 });

    expect(after).toEqual({ treasuryGold: 380 });
    expect(await caller.party.get()).toEqual({ treasuryGold: 380 });
  });

  it('refuses to overdraw the treasury', async () => {
    await caller.party.adjustTreasury({ delta: 100 });

    await expect(caller.party.adjustTreasury({ delta: -101 })).rejects.toThrow(
      /does not hold that much/,
    );
    expect(await caller.party.get()).toEqual({ treasuryGold: 100 });
  });

  it('refuses a zero change, which would only bump the version', async () => {
    await expect(caller.party.adjustTreasury({ delta: 0 })).rejects.toThrow();
  });

  it('bumps the sync version on every change', async () => {
    await caller.party.adjustTreasury({ delta: 10 });
    await caller.party.adjustTreasury({ delta: 10 });

    const [row] = await db.query.parties.findMany();
    expect(row?.version).toBe(3);
  });
});
