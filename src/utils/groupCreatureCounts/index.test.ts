import { describe, expect, it } from 'vitest';
import { groupCreatureCounts } from '~/utils/groupCreatureCounts';

describe('groupCreatureCounts', () => {
  it('counts duplicates of the same library creature', () => {
    expect(
      groupCreatureCounts([
        { creatureSlug: 'goblin', customCreatureId: null },
        { creatureSlug: 'goblin', customCreatureId: null },
        { creatureSlug: 'goblin', customCreatureId: null },
      ]),
    ).toEqual([
      {
        creatureSlug: 'goblin',
        customCreatureId: null,
        count: 3,
        sortOrder: 0,
      },
    ]);
  });

  it('counts duplicates of the same custom creature', () => {
    expect(
      groupCreatureCounts([
        { creatureSlug: null, customCreatureId: 'custom-goblin-boss' },
        { creatureSlug: null, customCreatureId: 'custom-goblin-boss' },
      ]),
    ).toEqual([
      {
        creatureSlug: null,
        customCreatureId: 'custom-goblin-boss',
        count: 2,
        sortOrder: 0,
      },
    ]);
  });

  it('keeps first-appearance order across a mix of both sources', () => {
    expect(
      groupCreatureCounts([
        { creatureSlug: 'hobgoblin', customCreatureId: null },
        { creatureSlug: null, customCreatureId: 'custom-goblin-boss' },
        { creatureSlug: 'hobgoblin', customCreatureId: null },
      ]),
    ).toEqual([
      {
        creatureSlug: 'hobgoblin',
        customCreatureId: null,
        count: 2,
        sortOrder: 0,
      },
      {
        creatureSlug: null,
        customCreatureId: 'custom-goblin-boss',
        count: 1,
        sortOrder: 1,
      },
    ]);
  });

  it('drops player characters, which are a roster and not an encounter', () => {
    expect(
      groupCreatureCounts([
        { creatureSlug: null, customCreatureId: null },
        { creatureSlug: 'goblin', customCreatureId: null },
        { creatureSlug: null, customCreatureId: null },
      ]),
    ).toEqual([
      {
        creatureSlug: 'goblin',
        customCreatureId: null,
        count: 1,
        sortOrder: 0,
      },
    ]);
  });

  it('reads an empty board as no monsters', () => {
    expect(groupCreatureCounts([])).toEqual([]);
  });
});
