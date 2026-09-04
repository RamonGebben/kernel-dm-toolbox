import { describe, expect, it } from 'vitest';
import {
  clampQuantity,
  toLibraryState,
} from '~/organisms/CreatureLibrary/hooks/useCreatureLibrary';

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

describe('clampQuantity', () => {
  it('keeps a sensible value', () => {
    expect(clampQuantity(4)).toBe(4);
  });

  it('never lets the field reach zero or go negative', () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-3)).toBe(1);
  });

  it('caps at the API limit rather than sending a rejected request', () => {
    expect(clampQuantity(999)).toBe(20);
  });

  it('truncates a fractional value', () => {
    expect(clampQuantity(3.9)).toBe(3);
  });

  it('recovers from an emptied number input', () => {
    expect(clampQuantity(Number.NaN)).toBe(1);
  });
});
