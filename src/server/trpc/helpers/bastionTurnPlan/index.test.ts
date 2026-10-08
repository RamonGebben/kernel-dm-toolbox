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
  space: 'roomy',
  holderCharacterId: WREN,
  jobOptionKey: null,
  jobNote: null,
  jobDaysRemaining: 0,
  jobValueGp: 0,
  jobQuantity: 0,
  outOfActionTurns: 0,
  ...overrides,
});

const contextWith = (
  facilities: Array<object> = [facility({})],
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
    storage: [],
    characters: [
      { id: SIGRID, name: 'Sigrid', level: 5, isActive: true },
      { id: WREN, name: 'Wren', level: 5, isActive: true },
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
        valueGp: null,
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

  it('lets any member at home order a facility someone else took', () => {
    const result = plan(
      draftFor({
        actors: [
          {
            bastionId: B,
            characterId: SIGRID,
            isPresent: true,
            maintain: false,
            facilityOrders: [
              { facilityId: STUDY, optionKey: 'book', costGp: 10, note: '' },
            ],
          },
        ],
      }),
    );

    expect(result.facilities[0]).toMatchObject({ jobOptionKey: 'book' });
    expect(result.lines).toContain('Sigrid: Arcane Study, Blank book (10 gp).');
  });

  it('still allows one order per facility, whoever gives it', () => {
    const order = { facilityId: STUDY, optionKey: 'book', costGp: 0, note: '' };
    const result = planTurnCommit(
      draftFor({
        actors: [
          {
            bastionId: B,
            characterId: SIGRID,
            isPresent: true,
            maintain: false,
            facilityOrders: [order],
          },
          {
            bastionId: B,
            characterId: WREN,
            isPresent: true,
            maintain: false,
            facilityOrders: [order],
          },
        ],
      }),
      contextWith(),
    );

    expect(result).toEqual({
      ok: false,
      problems: ['The Arcane Study was given two orders.'],
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
      {
        bastionId: B,
        name: 'Ruby goblet',
        quantity: 1,
        note: 'Treasure',
        valueGp: null,
      },
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
      'Sigrid rolled 53: Attack (1 defender lost).',
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

describe('planTurnCommit on a stale draft', () => {
  const GONE = '00000000-0000-4000-8000-0000000000aa';
  const NEW = '00000000-0000-4000-8000-0000000000bb';
  const hall = {
    id: NEW,
    name: 'The New Hall',
    ownerCharacterId: null,
    defenderCount: 0,
    isFullyEnclosed: false,
    isArmoryStocked: false,
    hasGuestMonster: false,
  };

  it('refuses events for a bastion abandoned since the turn started', () => {
    const result = planTurnCommit(
      draftFor({
        events: [
          eventFor(SIGRID, {
            bastionId: GONE,
            goldGained: 500,
            storageItem: 'A lost crown',
          }),
        ],
      }),
      contextWith(),
    );

    expect(result).toEqual({
      ok: false,
      problems: [expect.stringMatching(/abandoned or merged/)],
    });
  });

  it('refuses a draft whose bastions were merged into a new one', () => {
    const result = planTurnCommit(
      draftFor({
        actors: [
          {
            bastionId: GONE,
            characterId: SIGRID,
            isPresent: true,
            maintain: false,
            facilityOrders: [],
          },
        ],
      }),
      contextWith([], { bastions: [hall] }),
    );

    expect(result).toEqual({
      ok: false,
      problems: [expect.stringMatching(/abandoned or merged/)],
    });
  });

  it('refuses a draft that leaves out a bastion founded since', () => {
    const result = planTurnCommit(
      draftFor({}),
      contextWith(undefined, {
        bastions: [{ ...hall, id: B, name: 'The Hall' }, hall],
      }),
    );

    expect(result).toEqual({
      ok: false,
      problems: [
        expect.stringMatching(/The New Hall is not part of this turn/),
      ],
    });
  });
});

const ARMORY = '00000000-0000-4000-8000-0000000000f3';
const STOREHOUSE = '00000000-0000-4000-8000-0000000000f4';
const GOODS = '00000000-0000-4000-8000-0000000000a1';

const ordersFrom = (
  characterId: string,
  facilityOrders: TurnDraft['actors'][number]['facilityOrders'],
) => ({
  bastionId: B,
  characterId,
  isPresent: true,
  maintain: false,
  facilityOrders,
});

describe('the Armory in a turn', () => {
  const armory = facility({ id: ARMORY, facilityKey: 'armory' });
  const stockOption = (facilities: Array<object>) =>
    contextWith(facilities).bastions[0]!.facilities[0]!.orderOptions[0]!;

  it('prices stocking it from the defenders on the roster', () => {
    expect(stockOption([armory])).toMatchObject({ costGp: 700 });
    expect(stockOption([armory]).summary).toMatch(/^700 GP for 6 defenders\./);
  });

  it('halves the price when the bastion has a Smithy', () => {
    const option = stockOption([
      armory,
      facility({ id: SMITHY, facilityKey: 'smithy' }),
    ]);

    expect(option.costGp).toBe(350);
    expect(option.summary).toMatch(/halved by the Smithy/);
  });

  it('is stocked once the order finishes', () => {
    const context = contextWith([
      facility({
        id: ARMORY,
        facilityKey: 'armory',
        jobOptionKey: 'stock',
        jobDaysRemaining: 7,
      }),
    ]);

    expect(
      plan(
        draftFor({ completions: startTurnDraft(context).completions }),
        context,
      ).bastions[0]?.isArmoryStocked,
    ).toBe(true);
  });
});

describe('orders per character', () => {
  const three = [
    facility({}),
    facility({ id: SMITHY, facilityKey: 'smithy', holderCharacterId: SIGRID }),
    facility({ id: ARMORY, facilityKey: 'armory', holderCharacterId: SIGRID }),
  ];
  const order = (facilityId: string, optionKey: string) => ({
    facilityId,
    optionKey,
    costGp: 0,
    note: '',
  });

  it('allows as many as the level does, or as many as they hold', () => {
    const [bastion] = contextWith([
      ...three,
      facility({
        id: STOREHOUSE,
        facilityKey: 'storehouse',
        holderCharacterId: SIGRID,
      }),
    ]).bastions;

    expect(bastion?.actors).toMatchObject([
      { name: 'Sigrid', orderLimit: 3 },
      { name: 'Wren', orderLimit: 2 },
    ]);
  });

  it('refuses more orders from one character than they have', () => {
    const result = planTurnCommit(
      draftFor({
        actors: [
          ordersFrom(WREN, [
            order(STUDY, 'book'),
            order(SMITHY, 'smith-tools'),
            order(ARMORY, 'stock'),
          ]),
        ],
      }),
      contextWith(three),
    );

    expect(result).toEqual({
      ok: false,
      problems: ['Wren gave 3 orders but can give 2 this turn.'],
    });
  });
});

describe('the Storehouse in a turn', () => {
  const storehouse = (overrides: object = {}) =>
    facility({ id: STOREHOUSE, facilityKey: 'storehouse', ...overrides });
  const withGoods = (facilities: Array<object>) =>
    contextWith(facilities, {
      storage: [
        {
          id: GOODS,
          bastionId: B,
          name: 'Silk',
          valueGp: 300,
          claimedByCharacterId: null,
        },
        {
          id: 'plain',
          bastionId: B,
          name: 'Blank book',
          valueGp: null,
          claimedByCharacterId: null,
        },
      ],
    });

  it('remembers what a Buy goods order paid', () => {
    const result = plan(
      draftFor({
        actors: [
          ordersFrom(WREN, [
            {
              facilityId: STOREHOUSE,
              optionKey: 'buy',
              costGp: 300,
              note: 'Silk',
            },
          ]),
        ],
      }),
      contextWith([storehouse()]),
    );

    expect(result.treasuryDelta).toBe(-300);
    expect(result.facilities[0]).toMatchObject({
      jobOptionKey: 'buy',
      jobValueGp: 300,
    });
  });

  it('stores the goods at what was paid when the order finishes', () => {
    const context = contextWith([
      storehouse({
        jobOptionKey: 'buy',
        jobNote: 'Silk',
        jobValueGp: 300,
        jobDaysRemaining: 7,
      }),
    ]);
    const { completions } = startTurnDraft(context);

    expect(completions).toMatchObject([{ itemName: 'Silk', valueGp: 300 }]);
    expect(plan(draftFor({ completions }), context).storageItems).toEqual([
      {
        bastionId: B,
        name: 'Silk',
        quantity: 1,
        note: 'From the Storehouse',
        valueGp: 300,
      },
    ]);
  });

  it('offers only lots with a value for sale', () => {
    expect(withGoods([storehouse()]).bastions[0]?.goods).toEqual([
      { id: GOODS, name: 'Silk', valueGp: 300 },
    ]);
  });

  it('takes a sold lot out of storage and books the sale for later', () => {
    const result = plan(
      draftFor({
        actors: [
          ordersFrom(WREN, [
            {
              facilityId: STOREHOUSE,
              optionKey: 'sell',
              costGp: 0,
              note: '',
              storageItemId: GOODS,
            },
          ]),
        ],
      }),
      withGoods([storehouse()]),
    );

    expect(result.storageItemsToRemove).toEqual([GOODS]);
    expect(result.treasuryDelta).toBe(0);
    expect(result.facilities[0]).toMatchObject({ jobValueGp: 330 });
    expect(result.lines).toContain(
      'Wren: Storehouse, Sell goods (Silk worth 300 gp, for 330 gp).',
    );
  });

  it('pays the sale out when it finishes', () => {
    const context = contextWith([
      storehouse({
        jobOptionKey: 'sell',
        jobValueGp: 330,
        jobDaysRemaining: 7,
      }),
    ]);
    const { completions } = startTurnDraft(context);

    expect(completions).toMatchObject([{ itemName: '', goldGained: 330 }]);
    expect(plan(draftFor({ completions }), context).treasuryDelta).toBe(330);
  });

  it('refuses to sell goods that are not in storage', () => {
    const result = planTurnCommit(
      draftFor({
        actors: [
          ordersFrom(WREN, [
            { facilityId: STOREHOUSE, optionKey: 'sell', costGp: 0, note: '' },
          ]),
        ],
      }),
      contextWith([storehouse()]),
    );

    expect(result).toEqual({
      ok: false,
      problems: [
        'The Storehouse was told to sell goods that are not in storage.',
      ],
    });
  });
});

describe('the Barrack in a turn', () => {
  const BARRACK = '00000000-0000-4000-8000-0000000000f5';
  const barrack = (overrides: object = {}) =>
    facility({ id: BARRACK, facilityKey: 'barrack', ...overrides });

  it('remembers how many defenders the order recruits', () => {
    const result = plan(
      draftFor({
        actors: [
          ordersFrom(WREN, [
            {
              facilityId: BARRACK,
              optionKey: 'defenders',
              costGp: 0,
              note: '',
              quantity: 3,
            },
          ]),
        ],
      }),
      contextWith([barrack()]),
    );

    expect(result.facilities[0]).toMatchObject({ jobQuantity: 3 });
    expect(result.bastions[0]?.defenderCount).toBe(6);
    expect(result.lines).toContain(
      'Wren: Barrack, Recruit defenders (3 defenders).',
    );
  });

  it('never recruits more than four with one order', () => {
    const result = plan(
      draftFor({
        actors: [
          ordersFrom(WREN, [
            {
              facilityId: BARRACK,
              optionKey: 'defenders',
              costGp: 0,
              note: '',
              quantity: 9,
            },
          ]),
        ],
      }),
      contextWith([barrack()]),
    );

    expect(result.facilities[0]).toMatchObject({ jobQuantity: 4 });
  });

  it('adds the recruits to the roster when the order finishes', () => {
    const context = contextWith([
      barrack({
        jobOptionKey: 'defenders',
        jobQuantity: 3,
        jobDaysRemaining: 7,
      }),
    ]);
    const { completions } = startTurnDraft(context);
    const result = plan(draftFor({ completions }), context);

    expect(completions).toMatchObject([{ defendersGained: 3 }]);
    expect(result.bastions[0]?.defenderCount).toBe(9);
    expect(result.lines).toEqual([
      'Barrack finished Recruit defenders: +3 defenders.',
      'The Hall ends the turn with 9 defenders.',
    ]);
  });

  it('brings the full four for an order given before counts were kept', () => {
    const context = contextWith([
      barrack({ jobOptionKey: 'defenders', jobDaysRemaining: 7 }),
    ]);

    expect(startTurnDraft(context).completions).toMatchObject([
      { defendersGained: 4 },
    ]);
  });

  it('counts the bunks the barracks have', () => {
    expect(
      contextWith([barrack(), barrack({ id: SMITHY, space: 'vast' })])
        .bastions[0]?.defenderCapacity,
    ).toBe(37);
  });
});
