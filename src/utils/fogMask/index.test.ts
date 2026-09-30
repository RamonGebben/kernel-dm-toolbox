import { describe, expect, it } from 'vitest';
import {
  compositeOperationForMode,
  computeFogMaskScale,
  computeFogMaskSize,
  FOG_COMPACTION_STROKE_THRESHOLD,
  FOG_MASK_MAX_DIMENSION,
  innerRadiusForStroke,
  shouldCompactFog,
} from '~/utils/fogMask';

describe('innerRadiusForStroke', () => {
  it('is a hard edge (equal to the radius) at zero softness', () => {
    expect(innerRadiusForStroke({ radius: 40, softness: 0 })).toBe(40);
  });

  it('shrinks to zero at full softness', () => {
    expect(innerRadiusForStroke({ radius: 40, softness: 1 })).toBe(0);
  });

  it('feathers proportionally in between', () => {
    expect(innerRadiusForStroke({ radius: 40, softness: 0.5 })).toBe(20);
  });

  it('never goes negative for softness beyond 1', () => {
    expect(innerRadiusForStroke({ radius: 40, softness: 2 })).toBe(0);
  });
});

describe('computeFogMaskScale', () => {
  it('is 1 (no downscale) for a map already under the cap', () => {
    expect(computeFogMaskScale(1024, 768)).toBe(1);
  });

  it('is 1 for a map exactly at the cap', () => {
    expect(
      computeFogMaskScale(FOG_MASK_MAX_DIMENSION, FOG_MASK_MAX_DIMENSION / 2),
    ).toBe(1);
  });

  it('shrinks a map larger than the cap down to it, by its longer edge', () => {
    expect(computeFogMaskScale(12450, 12450)).toBeCloseTo(
      FOG_MASK_MAX_DIMENSION / 12450,
    );
  });

  it('uses the longer edge for a non-square map', () => {
    expect(computeFogMaskScale(4000, 8000)).toBeCloseTo(
      FOG_MASK_MAX_DIMENSION / 8000,
    );
  });
});

describe('computeFogMaskSize', () => {
  it('matches the map size 1:1 under the cap', () => {
    expect(computeFogMaskSize(1024, 768)).toEqual({ width: 1024, height: 768 });
  });

  it('caps the longer edge and scales the other proportionally', () => {
    expect(computeFogMaskSize(12450, 12450)).toEqual({
      width: FOG_MASK_MAX_DIMENSION,
      height: FOG_MASK_MAX_DIMENSION,
    });
    expect(computeFogMaskSize(4000, 8000)).toEqual({
      width: FOG_MASK_MAX_DIMENSION / 2,
      height: FOG_MASK_MAX_DIMENSION,
    });
  });

  it('never rounds down to zero for a degenerate dimension', () => {
    expect(computeFogMaskSize(0, 0)).toEqual({ width: 1, height: 1 });
  });
});

describe('compositeOperationForMode', () => {
  it('erases the mask for a reveal stroke', () => {
    expect(compositeOperationForMode('reveal')).toBe('destination-out');
  });

  it('paints the mask for a cover stroke', () => {
    expect(compositeOperationForMode('cover')).toBe('source-over');
  });
});

describe('shouldCompactFog', () => {
  it('does not compact below the threshold', () => {
    expect(shouldCompactFog(FOG_COMPACTION_STROKE_THRESHOLD - 1)).toBe(false);
  });

  it('compacts once the threshold is reached', () => {
    expect(shouldCompactFog(FOG_COMPACTION_STROKE_THRESHOLD)).toBe(true);
  });

  it('stays true past the threshold, so a client that missed one check still catches up', () => {
    expect(shouldCompactFog(FOG_COMPACTION_STROKE_THRESHOLD + 500)).toBe(true);
  });
});
