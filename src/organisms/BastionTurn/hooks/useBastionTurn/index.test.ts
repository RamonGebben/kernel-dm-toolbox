import { describe, expect, it } from 'vitest';
import {
  blankEvent,
  stepAfter,
  stepBefore,
  stepBlocker,
  syncEventsWithActors,
  updateEvent,
} from '~/organisms/BastionTurn/hooks/useBastionTurn';
import type { TurnDraft } from '~/server/trpc/schemas/bastionTurns';

const actor = (characterId: string, overrides = {}) => ({
  bastionId: 'b',
  characterId,
  isPresent: true,
  maintain: false,
  facilityOrders: [],
  ...overrides,
});

const draft = (overrides: Partial<TurnDraft>): TurnDraft => ({
  step: 'presence',
  completions: [],
  actors: [],
  events: [],
  ...overrides,
});

const bastion = { defenderCount: 4, hasGuestMonster: false };

describe('stepAfter / stepBefore', () => {
  it('walks the five steps in order and stops at the ends', () => {
    expect(stepAfter('since')).toBe('presence');
    expect(stepAfter('review')).toBe('review');
    expect(stepBefore('orders')).toBe('presence');
    expect(stepBefore('since')).toBe('since');
  });
});

describe('syncEventsWithActors', () => {
  it('gives anyone maintaining or away an event to roll', () => {
    const synced = syncEventsWithActors(
      draft({
        actors: [
          actor('sigrid', { maintain: true }),
          actor('wren', { isPresent: false }),
          actor('bo'),
        ],
      }),
    );

    expect(synced.events.map(event => event.characterId)).toEqual([
      'sigrid',
      'wren',
    ]);
  });

  it("drops the rolls of someone who now gives orders, keeps everyone else's", () => {
    const rolled = { ...blankEvent('b', 'sigrid'), roll: 40 };
    const synced = syncEventsWithActors(
      draft({
        actors: [actor('sigrid', { maintain: true }), actor('wren')],
        events: [rolled, { ...blankEvent('b', 'wren'), roll: 12 }],
      }),
    );

    expect(synced.events).toEqual([rolled]);
  });

  it('keeps a second event — an opportunity rerolled — for the same person', () => {
    const events = [
      { ...blankEvent('b', 'sigrid'), roll: 60 },
      { ...blankEvent('b', 'sigrid'), roll: 70 },
    ];

    expect(
      syncEventsWithActors(
        draft({ actors: [actor('sigrid', { maintain: true })], events }),
      ).events,
    ).toEqual(events);
  });
});

describe('updateEvent', () => {
  it('names the event from the d100', () => {
    expect(updateEvent(blankEvent('b', 's'), { roll: 53 }, bastion).key).toBe(
      'attack',
    );
  });

  it('works out the outcome from the event dice', () => {
    const attack = updateEvent(blankEvent('b', 's'), { roll: 53 }, bastion);

    expect(
      updateEvent(attack, { inputs: { ones: 3 } }, bastion).defendersLost,
    ).toBe(3);
  });

  it('clears the old dice when the d100 changes to another event', () => {
    const attack = updateEvent(
      updateEvent(blankEvent('b', 's'), { roll: 53 }, bastion),
      { inputs: { ones: 3 } },
      bastion,
    );
    const visitors = updateEvent(attack, { roll: 70 }, bastion);

    expect(visitors).toMatchObject({
      key: 'friendly-visitors',
      inputs: {},
      defendersLost: 0,
    });
  });
});

describe('stepBlocker', () => {
  it('holds the events step until every event is rolled', () => {
    expect(
      stepBlocker(draft({ step: 'events', events: [blankEvent('b', 's')] })),
    ).toBe('1 Bastion Event still to roll.');
    expect(
      stepBlocker(
        draft({
          step: 'events',
          events: [{ ...blankEvent('b', 's'), roll: 5 }],
        }),
      ),
    ).toBeNull();
  });

  it('never holds the other steps', () => {
    expect(stepBlocker(draft({ step: 'orders' }))).toBeNull();
  });
});
