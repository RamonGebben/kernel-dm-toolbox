import { describe, expect, it } from 'vitest';
import { groupCreatureCounts } from '~/utils/groupCreatureCounts';

describe('groupCreatureCounts', () => {
  it('counts duplicates of the same creature', () => {
    expect(
      groupCreatureCounts([
        { creatureSlug: 'goblin' },
        { creatureSlug: 'goblin' },
        { creatureSlug: 'goblin' },
      ]),
    ).toEqual([{ creatureSlug: 'goblin', count: 3, sortOrder: 0 }]);
  });

  it('keeps first-appearance order across creatures', () => {
    expect(
      groupCreatureCounts([
        { creatureSlug: 'hobgoblin' },
        { creatureSlug: 'goblin' },
        { creatureSlug: 'hobgoblin' },
      ]),
    ).toEqual([
      { creatureSlug: 'hobgoblin', count: 2, sortOrder: 0 },
      { creatureSlug: 'goblin', count: 1, sortOrder: 1 },
    ]);
  });

  it('drops player characters, which are a roster and not an encounter', () => {
    expect(
      groupCreatureCounts([
        { creatureSlug: null },
        { creatureSlug: 'goblin' },
        { creatureSlug: null },
      ]),
    ).toEqual([{ creatureSlug: 'goblin', count: 1, sortOrder: 0 }]);
  });

  it('reads an empty board as no monsters', () => {
    expect(groupCreatureCounts([])).toEqual([]);
  });
});
