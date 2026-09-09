import { describe, expect, it } from 'vitest';
import {
  computeOrientationFrame,
  derivePhysicalOrientation,
  resolveEffectiveOrientation,
} from '~/utils/screenOrientation';

describe('derivePhysicalOrientation', () => {
  it('treats a wider-than-tall viewport as landscape', () => {
    expect(derivePhysicalOrientation({ width: 1920, height: 1080 })).toBe(
      'landscape',
    );
  });

  it('treats a taller-than-wide viewport as portrait', () => {
    expect(derivePhysicalOrientation({ width: 1080, height: 1920 })).toBe(
      'portrait',
    );
  });

  it('treats a square viewport as landscape', () => {
    expect(derivePhysicalOrientation({ width: 1000, height: 1000 })).toBe(
      'landscape',
    );
  });
});

describe('resolveEffectiveOrientation', () => {
  it('follows the physical orientation when set to auto', () => {
    expect(resolveEffectiveOrientation('auto', 'landscape')).toBe('landscape');
    expect(resolveEffectiveOrientation('auto', 'portrait')).toBe('portrait');
  });

  it('overrides the physical orientation when explicitly set', () => {
    expect(resolveEffectiveOrientation('portrait', 'landscape')).toBe(
      'portrait',
    );
    expect(resolveEffectiveOrientation('landscape', 'portrait')).toBe(
      'landscape',
    );
  });
});

describe('computeOrientationFrame', () => {
  it('applies no rotation when the setting matches the physical orientation', () => {
    expect(
      computeOrientationFrame({ width: 1920, height: 1080 }, 'auto'),
    ).toEqual({ rotationDeg: 0, width: 1920, height: 1080 });

    expect(
      computeOrientationFrame({ width: 1920, height: 1080 }, 'landscape'),
    ).toEqual({ rotationDeg: 0, width: 1920, height: 1080 });
  });

  it('rotates and swaps dimensions when overridden against a landscape screen', () => {
    expect(
      computeOrientationFrame({ width: 1920, height: 1080 }, 'portrait'),
    ).toEqual({ rotationDeg: 90, width: 1080, height: 1920 });
  });

  it('rotates and swaps dimensions when overridden against a portrait screen', () => {
    expect(
      computeOrientationFrame({ width: 1080, height: 1920 }, 'landscape'),
    ).toEqual({ rotationDeg: 90, width: 1920, height: 1080 });
  });
});
