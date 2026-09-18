import { describe, expect, it } from 'vitest';
import { normalizeMapFogState } from '~/utils/normalizeMapFogState';
import type { MapFogState } from '~/server/db/schema';

const baseFog: MapFogState = {
  enabled: true,
  baseState: 'covered',
  opacityDm: 0.6,
  opacityTable: 0.9,
  baselineImage: null,
  strokes: [],
};

describe('normalizeMapFogState', () => {
  it('leaves an already-normalized row untouched', () => {
    const withBaseline = {
      ...baseFog,
      baselineImage: 'data:image/png;base64,x',
    };

    expect(normalizeMapFogState(withBaseline)).toEqual(withBaseline);
  });

  it('defaults a row written before baselineImage existed', () => {
    // Simulates a legacy JSON blob: the key is genuinely absent, not just
    // typed as present — `delete` rather than `baselineImage: undefined`.
    const legacy = { ...baseFog } as Partial<MapFogState>;
    delete legacy.baselineImage;

    expect(
      normalizeMapFogState(legacy as MapFogState).baselineImage,
    ).toBeNull();
  });
});
