import { describe, expect, it } from 'vitest';
import { nextTurn, previousTurn, sortCombatants } from '~/utils/sortCombatants';

const combatant = (
  id: string,
  initiative: number,
  sortOrder = 0,
  isDelayed = false,
) => ({ id, initiative, sortOrder, isDelayed });

/** The order from the reference screenshot. */
const order = [
  combatant('meat', 19, 0),
  combatant('dragon', 17, 1),
  combatant('sigrid', 10, 2),
  combatant('hammie', 5, 3),
];

describe('sortCombatants', () => {
  it('puts the highest initiative first', () => {
    expect(sortCombatants(order).map(c => c.id)).toEqual([
      'meat',
      'dragon',
      'sigrid',
      'hammie',
    ]);
  });

  it('breaks ties by insertion order, not arbitrarily', () => {
    const tied = [combatant('b', 15, 2), combatant('a', 15, 1)];

    expect(sortCombatants(tied).map(c => c.id)).toEqual(['a', 'b']);
  });

  it('sinks delayed combatants below everyone still in the order', () => {
    const withDelayed = [
      combatant('delayed', 25, 0, true),
      combatant('normal', 3, 1),
    ];

    expect(sortCombatants(withDelayed).map(c => c.id)).toEqual([
      'normal',
      'delayed',
    ]);
  });

  it('does not mutate its input', () => {
    const input = [...order];
    sortCombatants(input);

    expect(input.map(c => c.id)).toEqual(order.map(c => c.id));
  });
});

describe('nextTurn', () => {
  it('advances down the order', () => {
    expect(nextTurn(order, 'meat')).toEqual({
      activeId: 'dragon',
      didWrap: false,
    });
  });

  it('wraps to the top and reports it, so the round can advance', () => {
    expect(nextTurn(order, 'hammie')).toEqual({
      activeId: 'meat',
      didWrap: true,
    });
  });

  it('starts at the top when no one is active yet', () => {
    expect(nextTurn(order, null)).toEqual({
      activeId: 'meat',
      didWrap: true,
    });
  });

  it('recovers to the top if the active combatant left the fight', () => {
    expect(nextTurn(order, 'removed-id').activeId).toBe('meat');
  });

  it('skips a delayed combatant entirely', () => {
    const withDelayed = [
      combatant('a', 20, 0),
      combatant('b', 15, 1, true),
      combatant('c', 10, 2),
    ];

    expect(nextTurn(withDelayed, 'a').activeId).toBe('c');
  });

  it('has nobody to advance to in an empty encounter', () => {
    expect(nextTurn([], null)).toEqual({ activeId: null, didWrap: false });
  });
});

describe('previousTurn', () => {
  it('steps back up the order', () => {
    expect(previousTurn(order, 'sigrid')).toEqual({
      activeId: 'dragon',
      didWrap: false,
    });
  });

  it('wraps to the bottom from the top of the round', () => {
    expect(previousTurn(order, 'meat')).toEqual({
      activeId: 'hammie',
      didWrap: true,
    });
  });

  it('is the exact inverse of nextTurn in the middle of the order', () => {
    const forward = nextTurn(order, 'dragon').activeId;

    expect(previousTurn(order, forward).activeId).toBe('dragon');
  });
});
