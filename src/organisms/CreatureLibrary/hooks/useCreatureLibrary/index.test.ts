import { describe, expect, it } from 'vitest';
import { toLibraryState } from '~/organisms/CreatureLibrary/hooks/useCreatureLibrary';

const creature = {
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
