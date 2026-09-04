import { describe, expect, it } from 'vitest';
import { tickConditions } from '~/utils/tickConditions';

const condition = (id: string, roundsRemaining: number | null) => ({
  id,
  roundsRemaining,
});

describe('tickConditions', () => {
  it('counts a duration down by one round', () => {
    const { remaining } = tickConditions([condition('poisoned', 3)]);

    expect(remaining).toEqual([{ id: 'poisoned', roundsRemaining: 2 }]);
  });

  it('expires a condition on its last round rather than at zero', () => {
    // "1 round left" means this round is the last one.
    const { remaining, expired } = tickConditions([condition('stunned', 1)]);

    expect(remaining).toEqual([]);
    expect(expired.map(c => c.id)).toEqual(['stunned']);
  });

  it('never expires an indefinite condition', () => {
    const { remaining, expired } = tickConditions([condition('prone', null)]);

    expect(remaining).toEqual([{ id: 'prone', roundsRemaining: null }]);
    expect(expired).toEqual([]);
  });

  it('handles a mixed set in one pass', () => {
    const { remaining, expired } = tickConditions([
      condition('prone', null),
      condition('stunned', 1),
      condition('poisoned', 5),
    ]);

    expect(remaining.map(c => c.id)).toEqual(['prone', 'poisoned']);
    expect(expired.map(c => c.id)).toEqual(['stunned']);
  });

  it('expires a counter that somehow went below one', () => {
    const { expired } = tickConditions([condition('broken', 0)]);

    expect(expired.map(c => c.id)).toEqual(['broken']);
  });

  it('does nothing to an empty list', () => {
    expect(tickConditions([])).toEqual({ remaining: [], expired: [] });
  });

  it('does not mutate the conditions it was given', () => {
    const input = [condition('poisoned', 3)];
    tickConditions(input);

    expect(input[0].roundsRemaining).toBe(3);
  });
});
