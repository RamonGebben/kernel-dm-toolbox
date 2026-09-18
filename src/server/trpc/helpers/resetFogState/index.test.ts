import { describe, expect, it } from 'vitest';
import { resetFogState } from '~/server/trpc/helpers/resetFogState';
import type { MapFogState } from '~/server/db/schema';

const fog: MapFogState = {
  enabled: true,
  baseState: 'covered',
  opacityDm: 0.6,
  opacityTable: 0.9,
  baselineImage: 'data:image/png;base64,x',
  strokes: [
    {
      id: 'a',
      x: 0,
      y: 0,
      radius: 10,
      softness: 0,
      shape: 'circle',
      mode: 'reveal',
    },
  ],
};

describe('resetFogState', () => {
  it('sets the new base state, clears the baseline, and drops every stroke', () => {
    expect(resetFogState(fog, 'revealed')).toEqual({
      ...fog,
      baseState: 'revealed',
      baselineImage: null,
      strokes: [],
    });
  });

  it('leaves opacity and enabled untouched', () => {
    const result = resetFogState(fog, 'covered');

    expect(result.enabled).toBe(true);
    expect(result.opacityDm).toBe(0.6);
    expect(result.opacityTable).toBe(0.9);
  });
});
