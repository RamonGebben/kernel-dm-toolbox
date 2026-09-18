import { describe, expect, it } from 'vitest';
import {
  compositeOperationForMode,
  FOG_COMPACTION_STROKE_THRESHOLD,
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
