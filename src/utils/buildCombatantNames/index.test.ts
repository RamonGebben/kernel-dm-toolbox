import { describe, expect, it } from 'vitest';
import {
  buildCombatantNames,
  usedNumbersFor,
} from '~/utils/buildCombatantNames';

describe('usedNumbersFor', () => {
  it('counts a bare name as number one', () => {
    expect(usedNumbersFor('Goblin', ['Goblin'])).toEqual([1]);
  });

  it('reads the suffix off numbered names', () => {
    expect(usedNumbersFor('Goblin', ['Goblin 2', 'Goblin 3'])).toEqual([2, 3]);
  });

  it('ignores a different creature that merely starts the same', () => {
    expect(usedNumbersFor('Goblin', ['Goblin Boss', 'Goblins'])).toEqual([]);
  });

  it('ignores a renamed combatant', () => {
    expect(usedNumbersFor('Young Black Dragon', ['Meat'])).toEqual([]);
  });

  it('is not confused by regex characters in a name', () => {
    expect(usedNumbersFor('Will-o’-Wisp (2)', ['Will-o’-Wisp (2)'])).toEqual([
      1,
    ]);
  });
});

describe('buildCombatantNames', () => {
  it('leaves a lone creature unnumbered', () => {
    expect(buildCombatantNames({ baseName: 'Goblin', count: 1 })).toEqual([
      'Goblin',
    ]);
  });

  it('numbers a group added together from one', () => {
    expect(buildCombatantNames({ baseName: 'Goblin', count: 4 })).toEqual([
      'Goblin 1',
      'Goblin 2',
      'Goblin 3',
      'Goblin 4',
    ]);
  });

  it('continues after a bare existing name rather than colliding', () => {
    expect(
      buildCombatantNames({
        baseName: 'Goblin',
        count: 1,
        existingNames: ['Goblin'],
      }),
    ).toEqual(['Goblin 2']);
  });

  it('continues from the highest number in use', () => {
    expect(
      buildCombatantNames({
        baseName: 'Goblin',
        count: 2,
        existingNames: ['Goblin 1', 'Goblin 2', 'Goblin 3'],
      }),
    ).toEqual(['Goblin 4', 'Goblin 5']);
  });

  it('never reuses a number after one of a group was removed', () => {
    // Goblin 2 died; the next goblin is 4, not a recycled 2.
    expect(
      buildCombatantNames({
        baseName: 'Goblin',
        count: 1,
        existingNames: ['Goblin 1', 'Goblin 3'],
      }),
    ).toEqual(['Goblin 4']);
  });

  it('is unaffected by other creatures in the encounter', () => {
    expect(
      buildCombatantNames({
        baseName: 'Goblin',
        count: 1,
        existingNames: ['Sigrid', 'Young Black Dragon'],
      }),
    ).toEqual(['Goblin']);
  });

  it('returns nothing for a non-positive count', () => {
    expect(buildCombatantNames({ baseName: 'Goblin', count: 0 })).toEqual([]);
  });
});
