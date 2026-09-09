import { describe, expect, it } from 'vitest';
import {
  tokenizeDiceText,
  type DiceTextSegment,
} from '~/utils/tokenizeDiceText';

const diceSegments = (text: string) =>
  tokenizeDiceText(text).filter(
    (segment): segment is Extract<DiceTextSegment, { type: 'dice' }> =>
      segment.type === 'dice',
  );

describe('tokenizeDiceText', () => {
  it('matches plain dice with no modifier', () => {
    expect(diceSegments('1d6 Acid damage')).toEqual([
      { type: 'dice', value: '1d6', count: 1, sides: 6, modifier: 0 },
    ]);
    expect(diceSegments('3d6 Bludgeoning damage')).toEqual([
      { type: 'dice', value: '3d6', count: 3, sides: 6, modifier: 0 },
    ]);
  });

  it.each([
    ['10d6 + 40 Force damage', '10d6 + 40', 10, 6, 40],
    ['2d4 + 4 Temporary Hit Points', '2d4 + 4', 2, 4, 4],
    ['1d4 + 1 Force damage', '1d4 + 1', 1, 4, 1],
    ['regains 4d8 + 15 Hit Points.', '4d8 + 15', 4, 8, 15],
  ])(
    'matches a positive modifier at real spacing in %s',
    (text, value, count, sides, modifier) => {
      expect(diceSegments(text)).toEqual([
        { type: 'dice', value, count, sides, modifier },
      ]);
    },
  );

  it('matches a tightly-spaced modifier', () => {
    expect(diceSegments('8d6+4')).toEqual([
      { type: 'dice', value: '8d6+4', count: 8, sides: 6, modifier: 4 },
    ]);
  });

  it('matches a negative modifier', () => {
    expect(diceSegments('1 (1d4 - 1) Piercing damage')).toEqual([
      { type: 'dice', value: '1d4 - 1', count: 1, sides: 4, modifier: -1 },
    ]);
  });

  it('matches only the parenthetical dice, leaving the precomputed average as plain text', () => {
    const segments = tokenizeDiceText(
      '13 (2d6 + 6) Slashing damage plus 4 (1d8) Acid damage.',
    );

    expect(segments).toEqual([
      { type: 'text', value: '13 (' },
      { type: 'dice', value: '2d6 + 6', count: 2, sides: 6, modifier: 6 },
      { type: 'text', value: ') Slashing damage plus 4 (' },
      { type: 'dice', value: '1d8', count: 1, sides: 8, modifier: 0 },
      { type: 'text', value: ') Acid damage.' },
    ]);
  });

  it('matches every independent dice mention in one sentence', () => {
    expect(
      diceSegments('31 (9d6) Fire damage plus 31 (9d6) Force damage.'),
    ).toEqual([
      { type: 'dice', value: '9d6', count: 9, sides: 6, modifier: 0 },
      { type: 'dice', value: '9d6', count: 9, sides: 6, modifier: 0 },
    ]);

    expect(
      diceSegments(
        'Clenched Fist deals 6d8 Force damage. Grasping Hand deals 4d6 Bludgeoning damage.',
      ),
    ).toEqual([
      { type: 'dice', value: '6d8', count: 6, sides: 8, modifier: 0 },
      { type: 'dice', value: '4d6', count: 4, sides: 6, modifier: 0 },
    ]);
  });

  it('treats a bare die with no count as an implicit count of 1', () => {
    expect(diceSegments("the weapon's damage die becomes a d8.")).toEqual([
      { type: 'dice', value: 'd8', count: 1, sides: 8, modifier: 0 },
    ]);
    expect(diceSegments('Roll 1d6 at the end of each of your turns')).toEqual([
      { type: 'dice', value: '1d6', count: 1, sides: 6, modifier: 0 },
    ]);
  });

  it('matches percentile dice', () => {
    expect(
      diceSegments(
        'The GM rolls 1d100 and consults the Teleportation Outcome table',
      ),
    ).toEqual([
      { type: 'dice', value: '1d100', count: 1, sides: 100, modifier: 0 },
    ]);
  });

  it('matches a bare die immediately followed by a plural "s", excluding the "s" from the token', () => {
    const segments = tokenizeDiceText(
      'roll a d6 for each of your remaining duplicates. If any of the d6s rolls a 3 or higher',
    );

    expect(segments.filter(s => s.type === 'dice')).toEqual([
      { type: 'dice', value: 'd6', count: 1, sides: 6, modifier: 0 },
      { type: 'dice', value: 'd6', count: 1, sides: 6, modifier: 0 },
    ]);
    // The "s" itself survives as plain text right after the second token.
    expect(segments.at(-1)).toEqual({
      type: 'text',
      value: 's rolls a 3 or higher',
    });
  });

  it('matches multiple dice sizes listed in parens across a scaling sentence', () => {
    expect(
      diceSegments(
        'The damage increases by 1d6 when you reach levels 5 (2d6), 11 (3d6), and 17 (4d6).',
      ),
    ).toEqual([
      { type: 'dice', value: '1d6', count: 1, sides: 6, modifier: 0 },
      { type: 'dice', value: '2d6', count: 2, sides: 6, modifier: 0 },
      { type: 'dice', value: '3d6', count: 3, sides: 6, modifier: 0 },
      { type: 'dice', value: '4d6', count: 4, sides: 6, modifier: 0 },
    ]);
  });

  it('matches a bare die adjacent to a comma or period', () => {
    expect(diceSegments('gains a new body in 5d10 days,')).toEqual([
      { type: 'dice', value: '5d10', count: 5, sides: 10, modifier: 0 },
    ]);
  });

  it.each([
    'The damage increases by 1d4 for each spell slot level above 2.',
    '3rd level',
    'the SRD 2024 rules',
    'a 20-foot-radius Sphere',
    'this deals no damage',
    'a range of 01–00',
  ])('leaves unrelated text alone in %s', text => {
    const segments = diceSegments(text);
    if (text.includes('1d4')) {
      expect(segments).toEqual([
        { type: 'dice', value: '1d4', count: 1, sides: 4, modifier: 0 },
      ]);
    } else {
      expect(segments).toEqual([]);
    }
  });
});
