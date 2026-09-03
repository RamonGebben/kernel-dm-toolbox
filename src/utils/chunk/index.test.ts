import { describe, expect, it } from 'vitest';
import { chunk } from '~/utils/chunk';

describe('chunk', () => {
  it('splits evenly when the size divides the length', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('leaves a short final chunk rather than padding', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns nothing for an empty input', () => {
    expect(chunk([], 10)).toEqual([]);
  });

  it('returns a single chunk when the size exceeds the length', () => {
    expect(chunk([1, 2], 99)).toEqual([[1, 2]]);
  });

  it('degrades to one chunk rather than looping forever on size 0', () => {
    expect(chunk([1, 2], 0)).toEqual([[1, 2]]);
  });

  it('does not mutate the input', () => {
    const items = [1, 2, 3];
    chunk(items, 2);

    expect(items).toEqual([1, 2, 3]);
  });
});
