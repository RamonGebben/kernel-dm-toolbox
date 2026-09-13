import { describe, expect, it } from 'vitest';
import {
  toAddCreatureInput,
  toCreatureSourceInput,
  toLibraryState,
} from '~/organisms/CreatureLibrary/hooks/useCreatureLibrary';

const creature = {
  source: 'library' as const,
  slug: 'srd-2024_goblin',
  name: 'Goblin',
  challengeRatingLabel: '1/8',
};

describe('toLibraryState', () => {
  it('is pending while either query is still pending', () => {
    expect(
      toLibraryState({
        isStatusPending: true,
        isListPending: false,
        status: undefined,
        creatures: [],
      }).isPending,
    ).toBe(true);

    expect(
      toLibraryState({
        isStatusPending: false,
        isListPending: true,
        status: { isImported: true },
        creatures: undefined,
      }).isPending,
    ).toBe(true);
  });

  it('treats an unknown status as not imported, so the safer state wins', () => {
    expect(
      toLibraryState({
        isStatusPending: false,
        isListPending: false,
        status: undefined,
        creatures: [],
      }).isLibraryImported,
    ).toBe(false);
  });

  it('distinguishes an unimported library from a filter with no matches', () => {
    const neverImported = toLibraryState({
      isStatusPending: false,
      isListPending: false,
      status: { isImported: false },
      creatures: [],
    });
    const noMatches = toLibraryState({
      isStatusPending: false,
      isListPending: false,
      status: { isImported: true },
      creatures: [],
    });

    expect(neverImported.isLibraryImported).toBe(false);
    expect(noMatches.isLibraryImported).toBe(true);
    expect(noMatches.creatures).toEqual([]);
  });

  it('defaults an absent list to empty rather than undefined', () => {
    expect(
      toLibraryState({
        isStatusPending: false,
        isListPending: false,
        status: { isImported: true },
        creatures: undefined,
      }).creatures,
    ).toEqual([]);
  });

  it('passes creatures through once loaded', () => {
    expect(
      toLibraryState({
        isStatusPending: false,
        isListPending: false,
        status: { isImported: true },
        creatures: [creature],
      }).creatures,
    ).toEqual([creature]);
  });
});

describe('toAddCreatureInput', () => {
  it('builds a library-sourced union member from a library row', () => {
    expect(toAddCreatureInput(creature)).toEqual({
      source: 'library',
      slug: 'srd-2024_goblin',
      count: 1,
    });
  });

  it('builds a custom-sourced union member from a custom row', () => {
    expect(
      toAddCreatureInput({
        source: 'custom',
        id: 'custom-goblin-boss',
        name: 'Goblin Boss',
        challengeRatingLabel: '1',
      }),
    ).toEqual({ source: 'custom', id: 'custom-goblin-boss', count: 1 });
  });
});

describe('toCreatureSourceInput', () => {
  it('treats no boxes checked as "any", same as checking both', () => {
    expect(toCreatureSourceInput([])).toBe('all');
    expect(toCreatureSourceInput(['library', 'custom'])).toBe('all');
  });

  it('narrows to the one checked source', () => {
    expect(toCreatureSourceInput(['library'])).toBe('library');
    expect(toCreatureSourceInput(['custom'])).toBe('custom');
  });
});
