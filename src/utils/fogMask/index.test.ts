import { describe, expect, it } from 'vitest';
import {
  compositeOperationForMode,
  innerRadiusForStroke,
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
