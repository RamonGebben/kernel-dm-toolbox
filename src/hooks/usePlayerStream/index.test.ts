import { describe, expect, it } from 'vitest';
import { parsePlayerViewFrame } from '~/hooks/usePlayerStream';

const frame = JSON.stringify({
  roundNumber: 2,
  combatants: [
    {
      id: 'dragon',
      displayName: 'Young Black Dragon',
      initiative: 17,
      isActive: true,
      isPlayerCharacter: false,
      healthStatus: 'bloodied',
    },
  ],
});

describe('parsePlayerViewFrame', () => {
  it('parses a well-formed frame', () => {
    const view = parsePlayerViewFrame(frame);

    expect(view?.roundNumber).toBe(2);
    expect(view?.combatants[0].displayName).toBe('Young Black Dragon');
  });

  it('parses an empty encounter', () => {
    const view = parsePlayerViewFrame(
      JSON.stringify({ roundNumber: 0, combatants: [] }),
    );

    expect(view).toEqual({ roundNumber: 0, combatants: [] });
  });

  it('returns null for malformed JSON rather than throwing', () => {
    // The screen is on a wall in front of everyone; it must not blank out.
    expect(parsePlayerViewFrame('{not json')).toBeNull();
  });

  it('rejects a payload that is the wrong shape', () => {
    expect(parsePlayerViewFrame(JSON.stringify({ hello: 'world' }))).toBeNull();
    expect(parsePlayerViewFrame(JSON.stringify([1, 2, 3]))).toBeNull();
    expect(parsePlayerViewFrame(JSON.stringify(null))).toBeNull();
  });

  it('rejects a frame whose combatants are not a list', () => {
    expect(
      parsePlayerViewFrame(JSON.stringify({ combatants: 'lots' })),
    ).toBeNull();
  });
});
