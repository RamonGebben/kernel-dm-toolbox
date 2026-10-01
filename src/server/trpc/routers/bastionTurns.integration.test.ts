import { beforeEach, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '~/server/db/schema';
import type { Database } from '~/server/db';
import { appRouter } from '~/server/trpc/routers/_app';
import { createCallerFactory } from '~/server/trpc/init';
import type { TurnDraft } from '~/server/trpc/schemas/bastionTurns';

/** A bastion turn from start to commit, against a real database. */
const createCaller = createCallerFactory(appRouter);

let db: Database;
let caller: ReturnType<typeof createCaller>;

beforeEach(async () => {
  const client = createClient({ url: ':memory:' });
  db = drizzle(client, { schema }) as Database;
  await migrate(db, { migrationsFolder: 'src/server/db/migrations' });
  caller = createCaller({ db, headers: new Headers(), campaignName: 'Test' });
});

const setUp = async () => {
  const wren = await caller.characters.create({
    name: 'Wren',
    armorClass: 12,
    maxHitPoints: 30,
    level: 5,
    className: 'Wizard',
  });
  const bastion = await caller.bastions.found({
    mode: 'per-character',
    ownerCharacterId: wren.id,
    name: 'Tower',
    crampedBasicType: 'bedroom',
    roomyBasicType: 'kitchen',
  });
  const study = await caller.bastions.addSpecialFacility({
    bastionId: bastion.id,
    facilityKey: 'arcane-study',
  });
  await caller.party.adjustTreasury({ delta: 1000 });

  return { wren, bastion, study };
};

const currentDraft = async (): Promise<{ id: string; draft: TurnDraft }> => {
  const { turn } = await caller.bastionTurns.current();
  if (!turn) throw new Error('No turn in progress');
  return { id: turn.id, draft: turn.draft };
};

describe('bastionTurns.start', () => {
  it('opens turn 1 with everyone assumed home', async () => {
    await setUp();
    await caller.bastionTurns.start();

    const { turn, context } = await caller.bastionTurns.current();
    expect(turn?.number).toBe(1);
    expect(turn?.draft.step).toBe('since');
    expect(turn?.draft.actors).toHaveLength(1);
    expect(context.bastions[0]?.facilities[0]?.name).toBe('Arcane Study');
  });

  it('hands back the turn already under way instead of starting another', async () => {
    await setUp();
    const first = await caller.bastionTurns.start();

    expect(await caller.bastionTurns.start()).toEqual(first);
  });

  it('refuses with no bastion to take a turn for', async () => {
    await expect(caller.bastionTurns.start()).rejects.toThrow(/no bastion/);
  });
});

describe('bastionTurns.saveDraft and discard', () => {
  it('keeps progress, and a discarded turn changes nothing', async () => {
    await setUp();
    await caller.bastionTurns.start();
    const { id, draft } = await currentDraft();

    await caller.bastionTurns.saveDraft({
      id,
      draft: { ...draft, step: 'orders' },
    });
    expect((await currentDraft()).draft.step).toBe('orders');

    await caller.bastionTurns.discard({ id });
    expect((await caller.bastionTurns.current()).turn).toBeNull();
    expect(await caller.bastionTurns.history()).toEqual([]);
  });
});

describe('bastionTurns.commit', () => {
  it('starts an order, charges it, and delivers it the next turn', async () => {
    const { wren, bastion, study } = await setUp();

    await caller.bastionTurns.start();
    const first = await currentDraft();
    await caller.bastionTurns.saveDraft({
      id: first.id,
      draft: {
        ...first.draft,
        actors: [
          {
            bastionId: bastion.id,
            characterId: wren.id,
            isPresent: true,
            maintain: false,
            facilityOrders: [
              { facilityId: study.id, optionKey: 'book', costGp: 10, note: '' },
            ],
          },
        ],
      },
    });
    await caller.bastionTurns.commit({ id: first.id });

    expect(await caller.party.get()).toMatchObject({ treasuryGold: 990 });

    // Turn 2: the book is done, and the wizard offers to store it.
    await caller.bastionTurns.start();
    const second = await currentDraft();
    expect(second.draft.completions).toEqual([
      expect.objectContaining({ facilityId: study.id, itemName: 'Blank book' }),
    ]);
    await caller.bastionTurns.commit({ id: second.id });

    const detail = await caller.bastions.get({ id: bastion.id });
    expect(detail.storage.map(item => item.name)).toEqual(['Blank book']);

    const history = await caller.bastionTurns.history();
    expect(history.map(turn => turn.number)).toEqual([2, 1]);
    expect(history[1]?.lines).toContain(
      'Wren: Arcane Study — Blank book (10 gp).',
    );
  });

  it('lands an Attack on the defenders', async () => {
    const { wren, bastion } = await setUp();
    await caller.bastions.update({
      id: bastion.id,
      name: 'Tower',
      defenderCount: 5,
      wallSquares: 0,
      isFullyEnclosed: false,
    });

    await caller.bastionTurns.start();
    const { id, draft } = await currentDraft();
    await caller.bastionTurns.saveDraft({
      id,
      draft: {
        ...draft,
        actors: [
          {
            bastionId: bastion.id,
            characterId: wren.id,
            isPresent: false,
            maintain: false,
            facilityOrders: [],
          },
        ],
        events: [
          {
            bastionId: bastion.id,
            characterId: wren.id,
            roll: 53,
            key: 'attack',
            goldGained: 0,
            goldPaid: 0,
            defendersGained: 0,
            defendersLost: 2,
            outOfActionFacilityId: null,
            storageItem: '',
            guestKind: null,
            note: '',
            inputs: { ones: 2 },
          },
        ],
      },
    });
    await caller.bastionTurns.commit({ id });

    expect((await caller.bastions.get({ id: bastion.id })).defenderCount).toBe(
      3,
    );
  });

  it('refuses a turn with a missing event, changing nothing', async () => {
    const { wren, bastion } = await setUp();
    await caller.bastionTurns.start();
    const { id, draft } = await currentDraft();
    await caller.bastionTurns.saveDraft({
      id,
      draft: {
        ...draft,
        actors: [
          {
            bastionId: bastion.id,
            characterId: wren.id,
            isPresent: true,
            maintain: true,
            facilityOrders: [],
          },
        ],
      },
    });

    await expect(caller.bastionTurns.commit({ id })).rejects.toThrow(
      /no Bastion Event rolled/,
    );
    expect((await caller.bastionTurns.current()).turn?.id).toBe(id);
  });

  it('counts construction down and finishes it when the days run out', async () => {
    const { bastion } = await setUp();
    await caller.bastions.startProject({
      bastionId: bastion.id,
      request: { kind: 'add-basic', basicType: 'parlor', space: 'cramped' },
    });

    // 20 days: two turns leave 6, the third finishes it.
    for (let turn = 0; turn < 3; turn += 1) {
      await caller.bastionTurns.start();
      const { id } = await currentDraft();
      await caller.bastionTurns.commit({ id });
    }

    const detail = await caller.bastions.get({ id: bastion.id });
    expect(detail.projects).toEqual([]);
    expect(detail.basicFacilities.map(facility => facility.type)).toContain(
      'parlor',
    );
  });
});

describe('bastionTurns.preview', () => {
  it('shows what a commit would do without doing it', async () => {
    const { wren, bastion, study } = await setUp();
    await caller.bastionTurns.start();
    const { id, draft } = await currentDraft();
    const withOrder: TurnDraft = {
      ...draft,
      actors: [
        {
          bastionId: bastion.id,
          characterId: wren.id,
          isPresent: true,
          maintain: false,
          facilityOrders: [
            { facilityId: study.id, optionKey: 'book', costGp: 10, note: '' },
          ],
        },
      ],
    };

    const preview = await caller.bastionTurns.preview({ id, draft: withOrder });

    expect(preview).toMatchObject({ ok: true, treasuryDelta: -10 });
    expect(await caller.party.get()).toMatchObject({ treasuryGold: 1000 });
  });

  it('lists the problems that would stop the commit', async () => {
    const { wren, bastion } = await setUp();
    await caller.bastionTurns.start();
    const { id, draft } = await currentDraft();

    const preview = await caller.bastionTurns.preview({
      id,
      draft: {
        ...draft,
        actors: [
          {
            bastionId: bastion.id,
            characterId: wren.id,
            isPresent: false,
            maintain: false,
            facilityOrders: [],
          },
        ],
      },
    });

    expect(preview).toEqual({
      ok: false,
      problems: ['Wren maintains but has no Bastion Event rolled.'],
    });
  });
});

describe('a turn started before a bastion changed', () => {
  it('refuses to commit events for a bastion abandoned since', async () => {
    const { wren, bastion } = await setUp();
    const { id } = await caller.bastionTurns.start();
    const { draft } = await currentDraft();
    await caller.bastionTurns.saveDraft({
      id,
      draft: {
        ...draft,
        actors: draft.actors.map(actor => ({ ...actor, maintain: true })),
        events: [
          {
            bastionId: bastion.id,
            characterId: wren.id,
            roll: 80,
            key: 'treasure',
            goldGained: 0,
            goldPaid: 0,
            defendersGained: 0,
            defendersLost: 0,
            outOfActionFacilityId: null,
            storageItem: 'A golden idol',
            guestKind: null,
            note: '',
            inputs: {},
          },
        ],
      },
    });

    await caller.bastions.abandon({ id: bastion.id });

    await expect(caller.bastionTurns.commit({ id })).rejects.toThrow(
      /abandoned or merged/,
    );
    expect(await db.query.bastionStorageItems.findMany()).toEqual([]);
  });
});
