import { describe, expect, it } from 'vitest';
import { computeRevealedCount } from '~/organisms/BattleViewer/hooks/usePlaybackClock';

describe('computeRevealedCount', () => {
  it('reveals nothing at zero elapsed time', () => {
    expect(computeRevealedCount(10, 0, 1)).toBe(0);
  });

  it('reveals more entries as time passes at 1x', () => {
    expect(computeRevealedCount(10, 600, 1)).toBe(1);
    expect(computeRevealedCount(10, 1800, 1)).toBe(3);
  });

  it('scales with speed', () => {
    expect(computeRevealedCount(10, 600, 2)).toBe(2);
    expect(computeRevealedCount(10, 600, 0.5)).toBe(0);
  });

  it('clamps to the total entry count', () => {
    expect(computeRevealedCount(3, 100_000, 4)).toBe(3);
  });

  it('returns zero for an empty log regardless of elapsed time', () => {
    expect(computeRevealedCount(0, 5000, 1)).toBe(0);
  });
});
