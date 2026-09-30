import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_RATING_OPTIONS,
  toAddCreatureInput,
  toCreatureSourceInput,
  toDocumentsFilterInput,
  toLibraryState,
  withMaxChallengeRating,
  withMinChallengeRating,
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

describe('toDocumentsFilterInput', () => {
  it('drops the document selection once narrowed to custom-only', () => {
    expect(toDocumentsFilterInput('custom', ['srd-2024'])).toEqual([]);
  });

  it('passes the selection through for library or all', () => {
    expect(toDocumentsFilterInput('library', ['srd-2024'])).toEqual([
      'srd-2024',
    ]);
    expect(toDocumentsFilterInput('all', ['srd-2024'])).toEqual(['srd-2024']);
  });
});

describe('CHALLENGE_RATING_OPTIONS', () => {
  it('lists every rules CR in ascending order, fractions as fractions', () => {
    expect(CHALLENGE_RATING_OPTIONS.slice(0, 5)).toEqual([
      { value: 0, label: '0' },
      { value: 0.125, label: '1/8' },
      { value: 0.25, label: '1/4' },
      { value: 0.5, label: '1/2' },
      { value: 1, label: '1' },
    ]);
    expect(CHALLENGE_RATING_OPTIONS.at(-1)).toEqual({ value: 30, label: '30' });
    expect(CHALLENGE_RATING_OPTIONS).toHaveLength(34);
  });
});

describe('withMinChallengeRating', () => {
  it('sets the minimum and leaves a compatible maximum alone', () => {
    expect(withMinChallengeRating({ min: null, max: 5 }, 2)).toEqual({
      min: 2,
      max: 5,
    });
  });

  it('drags the maximum up rather than inverting the range', () => {
    expect(withMinChallengeRating({ min: 1, max: 3 }, 8)).toEqual({
      min: 8,
      max: 8,
    });
  });

  it('clears the minimum without touching the maximum', () => {
    expect(withMinChallengeRating({ min: 1, max: 3 }, null)).toEqual({
      min: null,
      max: 3,
    });
  });
});

describe('withMaxChallengeRating', () => {
  it('sets the maximum and leaves a compatible minimum alone', () => {
    expect(withMaxChallengeRating({ min: 0.25, max: null }, 4)).toEqual({
      min: 0.25,
      max: 4,
    });
  });

  it('drags the minimum down rather than inverting the range', () => {
    expect(withMaxChallengeRating({ min: 5, max: 10 }, 0.5)).toEqual({
      min: 0.5,
      max: 0.5,
    });
  });

  it('clears the maximum without touching the minimum', () => {
    expect(withMaxChallengeRating({ min: 5, max: 10 }, null)).toEqual({
      min: 5,
      max: null,
    });
  });
});
