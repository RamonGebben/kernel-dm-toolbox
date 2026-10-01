import { describe, expect, it } from 'vitest';
import { isMaintaining } from '~/utils/bastionTurn';
import {
  planTurnCommit,
  startTurnDraft,
  toTurnContext,
} from '~/server/trpc/helpers/bastionTurnPlan';
import type { TurnDraft } from '~/server/trpc/schemas/bastionTurns';

const B = '00000000-0000-4000-8000-00000000000b';
const SIGRID = '00000000-0000-4000-8000-000000000001';
const WREN = '00000000-0000-4000-8000-000000000002';
const STUDY = '00000000-0000-4000-8000-0000000000f1';
const SMITHY = '00000000-0000-4000-8000-0000000000f2';

const facility = (overrides: object) => ({
  id: STUDY,
  bastionId: B,
  facilityKey: 'arcane-study',
  holderCharacterId: WREN,
  jobOptionKey: null,
  jobNote: null,
  jobDaysRemaining: 0,
  outOfActionTurns: 0,
  ...overrides,
});

const contextWith = (
  facilities: object[] = [facility({})],
  overrides: Partial<Parameters<typeof toTurnContext>[0]> = {},
) =>
  toTurnContext({
    turnNumber: 3,
    treasuryGold: 1000,
    bastions: [
      {
        id: B,
        name: 'The Hall',
        ownerCharacterId: null,
        defenderCount: 6,
        isFullyEnclosed: false,
        isArmoryStocked: false,
        hasGuestMonster: false,
      },
    ],
    facilities: facilities as Parameters<typeof toTurnContext>[0]['facilities'],
    projects: [],
    characters: [
      { id: SIGRID, name: 'Sigrid', isActive: true },
      { id: WREN, name: 'Wren', isActive: true },
    ],
    ...overrides,
  });

const draftFor = (overrides: Partial<TurnDraft>): TurnDraft => ({
  step: 'review',
  completions: [],
  actors: [
    {
      bastionId: B,
      characterId: SIGRID,
      isPresent: true,
      maintain: false,
      facilityOrders: [],
    },
    {
      bastionId: B,
      characterId: WREN,
      isPresent: true,
      maintain: false,
      facilityOrders: [],
    },
  ],
  events: [],
  ...overrides,
});

const eventFor = (characterId: string, overrides: object) => ({
  bastionId: B,
  characterId,
  roll: 1,
  key: 'all-is-well' as const,
  goldGained: 0,
  goldPaid: 0,
  defendersGained: 0,
  defendersLost: 0,
  outOfActionFacilityId: null,
  storageItem: '',
  guestKind: null,
  note: '',
  inputs: {},
  ...overrides,
});

const plan = (draft: TurnDraft, context = contextWith()) => {
  const result = planTurnCommit(draft, context);
  if (!result.ok) throw new Error(result.problems.join('\n'));
  return result.plan;
};

describe('toTurnContext', () => {
  it('lets every party member take the turn for the party bastion', () => {
    expect(contextWith().bastions[0]?.actors.map(actor => actor.name)).toEqual([
      'Sigrid',
      'Wren',
    ]);
  });

  it('marks a job that ends within the week, and one that runs on', () => {
    const [finishing, busy] = contextWith([
      facility({ jobOptionKey: 'book', jobDaysRemaining: 7 }),
      facility({ id: SMITHY, facilityKey: 'smithy', jobDaysRemaining: 20 }),
    ]).bastions[0]!.facilities;

    expect(finishing).toMatchObject({
      finishesThisTurn: true,
      isBusy: false,
      jobLabel: 'Blank book',
    });
    expect(busy).toMatchObject({ finishesThisTurn: false, isBusy: true });
  });

  it('splits construction into what finishes and what carries on', () => {
    const [bastion] = contextWith([], {
      projects: [
        {
          id: 'p1',
          bastionId: B,
          description: 'Build a Cramped Parlor',
          daysRemaining: 5,
        },
        {
          id: 'p2',
          bastionId: B,
          description: 'Build 8 squares of wall',
          daysRemaining: 80,
        },
      ],
    }).bastions;

    expect(bastion?.projectsFinishing).toEqual([
      { id: 'p1', description: 'Build a Cramped Parlor' },
    ]);
    expect(bastion?.projectsContinuing).toEqual([
      { id: 'p2', description: 'Build 8 squares of wall', daysLeftAfter: 73 },
    ]);
  });
});

describe('startTurnDraft', () => {
  it('lists finished jobs, suggesting a crafted item, and assumes everyone home', () => {
    const draft = startTurnDraft(
      contextWith([facility({ jobOptionKey: 'book', jobDaysRemaining: 7 })]),
    );

    expect(draft.step).toBe('since');
    expect(draft.completions).toEqual([
      {
        facilityId: STUDY,
        itemName: 'Blank book',
        quantity: 1,
        goldGained: 0,
        defendersGained: 0,
      },
    ]);
    expect(
      draft.actors.every(actor => actor.isPresent && !actor.maintain),
    ).toBe(true);
  });
});

describe('isMaintaining', () => {
  it('treats being away as Maintain', () => {
    expect(isMaintaining({ isPresent: false, maintain: false })).toBe(true);
    expect(isMaintaining({ isPresent: true, maintain: true })).toBe(true);
    expect(isMaintaining({ isPresent: true, maintain: false })).toBe(false);
  });
});

describe('planTurnCommit', () => {
  it('starts an order: sets the job, its days and charges the cost', () => {
    const result = plan(
      draftFor({
        actors: [
          {
            bastionId: B,
            characterId: WREN,
            isPresent: true,
            maintain: false,
            facilityOrders: [
              { facilityId: STUDY, optionKey: 'book', costGp: 10, note: '' },
            ],
          },
        ],
      }),
    );

    expect(result.facilities[0]).toMatchObject({
      jobOptionKey: 'book',
      jobDaysRemaining: 7,
    });
    expect(result.treasuryDelta).toBe(-10);
  });

  it('delivers a finished job: item to storage, gold, defenders', () => {
    const result = plan(
      draftFor({
        completions: [
          {
            facilityId: STUDY,
            itemName: 'Blank book',
            quantity: 2,
            goldGained: 50,
            defendersGained: 3,
          },
        ],
      }),
      contextWith([facility({ jobOptionKey: 'book', jobDaysRemaining: 7 })]),
    );

    expect(result.storageItems).toEqual([
      {
        bastionId: B,
        name: 'Blank book',
        quantity: 2,
        note: 'From the Arcane Study',
      },
    ]);
    expect(result.treasuryDelta).toBe(50);
    expect(result.bastions[0]?.defenderCount).toBe(9);
    expect(result.facilities[0]).toMatchObject({
      jobOptionKey: null,
      jobDaysRemaining: 0,
    });
  });

  it('keeps a long job running, seven days shorter', () => {
    const result = plan(
      draftFor({}),
      contextWith([
        facility({ jobOptionKey: 'magic-item', jobDaysRemaining: 20 }),
      ]),
    );

    expect(result.facilities[0]).toMatchObject({
      jobOptionKey: 'magic-item',
      jobDaysRemaining: 13,
    });
  });

  it("refuses an order to someone else's facility", () => {
    const result = planTurnCommit(
      draftFor({
        actors: [
          {
            bastionId: B,
            characterId: SIGRID,
            isPresent: true,
            maintain: false,
            facilityOrders: [
              { facilityId: STUDY, optionKey: 'book', costGp: 0, note: '' },
            ],
          },
        ],
      }),
      contextWith(),
    );

    expect(result).toEqual({
      ok: false,
      problems: ['Sigrid does not hold the Arcane Study.'],
    });
  });

  it('refuses an order to a busy or out-of-action facility', () => {
    const order = (facilityId: string) => ({
      bastionId: B,
      characterId: WREN,
      isPresent: true,
      maintain: false,
      facilityOrders: [{ facilityId, optionKey: 'book', costGp: 0, note: '' }],
    });

    expect(
      planTurnCommit(
        draftFor({ actors: [order(STUDY)] }),
        contextWith([
          facility({ jobOptionKey: 'magic-item', jobDaysRemaining: 30 }),
        ]),
      ),
    ).toEqual({
      ok: false,
      problems: ['The Arcane Study is still busy with its last job.'],
    });
    expect(
      planTurnCommit(
        draftFor({ actors: [order(STUDY)] }),
        contextWith([facility({ outOfActionTurns: 1 })]),
      ),
    ).toEqual({
      ok: false,
      problems: ['The Arcane Study is out of action this turn.'],
    });
  });

  it('wants a Bastion Event from everyone who maintains or is away', () => {
    const result = planTurnCommit(
      draftFor({
        actors: [
          {
            bastionId: B,
            characterId: SIGRID,
            isPresent: false,
            maintain: false,
            facilityOrders: [],
          },
        ],
      }),
      contextWith(),
    );

    expect(result).toEqual({
      ok: false,
      problems: ['Sigrid maintains but has no Bastion Event rolled.'],
    });
  });

  it('applies an Attack: defenders lost, the Armory used up', () => {
    const result = plan(
      draftFor({
        actors: [
          {
            bastionId: B,
            characterId: SIGRID,
            isPresent: true,
            maintain: true,
            facilityOrders: [],
          },
        ],
        events: [
          eventFor(SIGRID, { roll: 52, key: 'attack', defendersLost: 2 }),
        ],
      }),
      contextWith([facility({})], {
        bastions: [
          {
            id: B,
            name: 'The Hall',
            ownerCharacterId: null,
            defenderCount: 6,
            isFullyEnclosed: false,
            isArmoryStocked: true,
            hasGuestMonster: false,
          },
        ],
      }),
    );

    expect(result.bastions[0]).toMatchObject({
      defenderCount: 4,
      isArmoryStocked: false,
    });
  });

  it('a friendly monster guest spares the defenders, once', () => {
    const result = plan(
      draftFor({
        actors: [
          {
            bastionId: B,
            characterId: SIGRID,
            isPresent: true,
            maintain: true,
            facilityOrders: [],
          },
        ],
        events: [
          eventFor(SIGRID, { roll: 52, key: 'attack', defendersLost: 3 }),
        ],
      }),
      contextWith([facility({})], {
        bastions: [
          {
            id: B,
            name: 'The Hall',
            ownerCharacterId: null,
            defenderCount: 6,
            isFullyEnclosed: false,
            isArmoryStocked: false,
            hasGuestMonster: true,
          },
        ],
      }),
    );

    expect(result.bastions[0]).toMatchObject({
      defenderCount: 6,
      hasGuestMonster: false,
    });
  });

  it('puts a facility out of action for the next turn', () => {
    const result = plan(
      draftFor({
        actors: [
          {
            bastionId: B,
            characterId: SIGRID,
            isPresent: true,
            maintain: true,
            facilityOrders: [],
          },
        ],
        events: [
          eventFor(SIGRID, {
            roll: 78,
            key: 'lost-hirelings',
            outOfActionFacilityId: STUDY,
          }),
        ],
      }),
    );

    expect(result.facilities[0]?.outOfActionTurns).toBe(1);
  });

  it('keeps a facility working when its criminal hireling is bribed free', () => {
    const result = plan(
      draftFor({
        actors: [
          {
            bastionId: B,
            characterId: SIGRID,
            isPresent: true,
            maintain: true,
            facilityOrders: [],
          },
        ],
        events: [
          eventFor(SIGRID, {
            roll: 57,
            key: 'criminal-hireling',
            outOfActionFacilityId: STUDY,
            goldPaid: 300,
            inputs: { bribeRoll: 3, pay: 1 },
          }),
        ],
      }),
    );

    expect(result.facilities[0]?.outOfActionTurns).toBe(0);
    expect(result.treasuryDelta).toBe(-300);
  });

  it('brings a facility back after its turn out of action', () => {
    const result = plan(
      draftFor({}),
      contextWith([facility({ outOfActionTurns: 1 })]),
    );

    expect(result.facilities[0]?.outOfActionTurns).toBe(0);
  });

  it('stores event treasure and counts event gold', () => {
    const result = plan(
      draftFor({
        actors: [
          {
            bastionId: B,
            characterId: SIGRID,
            isPresent: true,
            maintain: true,
            facilityOrders: [],
          },
        ],
        events: [
          eventFor(SIGRID, {
            roll: 99,
            key: 'treasure',
            storageItem: 'Ruby goblet',
          }),
          eventFor(SIGRID, {
            roll: 70,
            key: 'friendly-visitors',
            goldGained: 300,
          }),
        ],
      }),
    );

    expect(result.storageItems).toEqual([
      { bastionId: B, name: 'Ruby goblet', quantity: 1, note: 'Treasure' },
    ]);
    expect(result.treasuryDelta).toBe(300);
  });

  it('refuses a turn the treasury cannot pay for', () => {
    const result = planTurnCommit(
      draftFor({
        actors: [
          {
            bastionId: B,
            characterId: SIGRID,
            isPresent: true,
            maintain: true,
            facilityOrders: [],
          },
        ],
        events: [
          eventFor(SIGRID, {
            roll: 60,
            key: 'extraordinary-opportunity',
            goldPaid: 1500,
          }),
        ],
      }),
      contextWith(),
    );

    expect(result.ok).toBe(false);
  });

  it('finishes construction due this week and advances the rest', () => {
    const result = plan(
      draftFor({}),
      contextWith([], {
        projects: [
          {
            id: 'p1',
            bastionId: B,
            description: 'Build a Cramped Parlor',
            daysRemaining: 5,
          },
          {
            id: 'p2',
            bastionId: B,
            description: 'Build walls',
            daysRemaining: 80,
          },
        ],
      }),
    );

    expect(result.projectsToComplete).toEqual(['p1']);
    expect(result.projectsToAdvance).toEqual([{ id: 'p2', daysRemaining: 73 }]);
    expect(result.lines).toContain('Finished: Build a Cramped Parlor.');
  });
});

describe('planTurnCommit history lines', () => {
  it('says what each event came to', () => {
    const result = plan(
      draftFor({
        actors: [
          {
            bastionId: B,
            characterId: SIGRID,
            isPresent: false,
            maintain: false,
            facilityOrders: [],
          },
        ],
        events: [
          eventFor(SIGRID, { roll: 53, key: 'attack', defendersLost: 1 }),
        ],
      }),
    );

    expect(result.lines).toContain(
      'Sigrid rolled 53: Attack — 1 defender lost.',
    );
  });

  it('keeps a quiet week to the roll', () => {
    const result = plan(
      draftFor({
        actors: [
          {
            bastionId: B,
            characterId: SIGRID,
            isPresent: true,
            maintain: true,
            facilityOrders: [],
          },
        ],
        events: [eventFor(SIGRID, { roll: 12 })],
      }),
    );

    expect(result.lines).toContain('Sigrid rolled 12: All Is Well.');
  });
});
