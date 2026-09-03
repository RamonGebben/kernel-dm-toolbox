import { describe, expect, it } from 'vitest';
import { partitionByParent } from '~/server/library/mappers/partitionByParent';

const actions = [
  { slug: 'a1', creatureSlug: 'aboleth' },
  { slug: 'a2', creatureSlug: 'ghost-of-another-document' },
  { slug: 'a3', creatureSlug: 'goblin' },
];

describe('partitionByParent', () => {
  it('keeps rows whose parent was imported', () => {
    const { kept } = partitionByParent(
      actions,
      'creatureSlug',
      new Set(['aboleth', 'goblin']),
    );

    expect(kept.map(row => row.slug)).toEqual(['a1', 'a3']);
  });

  it('separates rows pointing at a parent that is not present', () => {
    const { orphaned } = partitionByParent(
      actions,
      'creatureSlug',
      new Set(['aboleth', 'goblin']),
    );

    expect(orphaned.map(row => row.slug)).toEqual(['a2']);
  });

  it('orphans everything when no parents are known', () => {
    const { kept, orphaned } = partitionByParent(
      actions,
      'creatureSlug',
      new Set<string>(),
    );

    expect(kept).toEqual([]);
    expect(orphaned).toHaveLength(3);
  });

  it('does not mutate the rows it was given', () => {
    const original = [...actions];
    partitionByParent(actions, 'creatureSlug', new Set(['aboleth']));

    expect(actions).toEqual(original);
  });
});
