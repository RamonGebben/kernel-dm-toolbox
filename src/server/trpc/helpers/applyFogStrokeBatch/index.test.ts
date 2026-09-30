import { describe, expect, it } from 'vitest';
import { applyFogStrokeBatch } from '~/server/trpc/helpers/applyFogStrokeBatch';
import type { MapFogState } from '~/server/db/schema';

const baseFog: MapFogState = {
  enabled: true,
  baseState: 'covered',
  opacityDm: 0.6,
  opacityTable: 0.9,
  baselineImage: null,
  strokes: [],
};

describe('applyFogStrokeBatch', () => {
  it('appends the new strokes after the existing ones', () => {
    const existing: MapFogState = {
      ...baseFog,
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

    const result = applyFogStrokeBatch(existing, [
      {
        id: 'b',
        x: 1,
        y: 1,
        radius: 5,
        softness: 0.5,
        shape: 'square',
        mode: 'cover',
      },
    ]);

    expect(result.strokes.map(stroke => stroke.id)).toEqual(['a', 'b']);
  });

  it('leaves every other field untouched', () => {
    const withBaseline = {
      ...baseFog,
      baselineImage: 'data:image/png;base64,x',
    };
    const result = applyFogStrokeBatch(withBaseline, [
      {
        id: 'a',
        x: 0,
        y: 0,
        radius: 10,
        softness: 0,
        shape: 'circle',
        mode: 'reveal',
      },
    ]);

    expect(result.enabled).toBe(true);
    expect(result.baseState).toBe('covered');
    expect(result.opacityDm).toBe(0.6);
    expect(result.opacityTable).toBe(0.9);
    // A batch appends on top of whatever's already compacted — it never
    // touches the baseline itself.
    expect(result.baselineImage).toBe('data:image/png;base64,x');
  });
});
