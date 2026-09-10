import { describe, expect, it } from 'vitest';
import {
  MAX_EFFECT_WAIT_MS,
  buildMeasurementLabelText,
  computeAimPreview,
  computeGridDistanceFeet,
  computeMeasurementPreview,
  computeShapeFootprint,
  computeShapeLabelAnchor,
  computeShapeVideoBounds,
  isEffectPlaying,
  isPointInShapeFootprint,
  mapDamageTypesToColor,
  mapSpellShapeType,
  shouldLoopSpellEffect,
  snapPointToGrid,
} from '~/utils/mapMeasurement';

const grid = { cellSize: 50, originX: 0, originY: 0 };

describe('snapPointToGrid', () => {
  it('rounds to the nearest grid intersection', () => {
    expect(snapPointToGrid({ x: 62, y: 38 }, grid)).toEqual({ x: 50, y: 50 });
  });

  it('accounts for a non-zero grid origin', () => {
    expect(
      snapPointToGrid(
        { x: 37, y: 12 },
        { cellSize: 50, originX: 10, originY: 10 },
      ),
    ).toEqual({ x: 60, y: 10 });
  });
});

describe('computeGridDistanceFeet', () => {
  it('counts an orthogonal move in whole cells', () => {
    expect(
      computeGridDistanceFeet({ x: 0, y: 0 }, { x: 150, y: 0 }, grid),
    ).toBe(15);
  });

  it('counts a diagonal move the same as an orthogonal one of the same cell count', () => {
    // Three cells right, three cells down — 5e grid-square counting charges
    // the same 15 ft a purely orthogonal three-cell move would, not the
    // Euclidean ~21.2 ft.
    expect(
      computeGridDistanceFeet({ x: 0, y: 0 }, { x: 150, y: 150 }, grid),
    ).toBe(15);
  });

  it('takes the larger axis when the move is not square', () => {
    expect(
      computeGridDistanceFeet({ x: 0, y: 0 }, { x: 250, y: 50 }, grid),
    ).toBe(25);
  });
});

describe('computeMeasurementPreview', () => {
  it('has no orientation for a circle', () => {
    const preview = computeMeasurementPreview({
      shapeType: 'circle',
      origin: { x: 0, y: 0 },
      cursor: { x: 100, y: 0 },
      grid,
    });

    expect(preview.orientation).toBeNull();
    expect(preview.extentFeet).toBe(10);
  });

  it('computes a free-angle orientation for a cone', () => {
    const preview = computeMeasurementPreview({
      shapeType: 'cone',
      origin: { x: 0, y: 0 },
      cursor: { x: 0, y: 100 },
      grid,
    });

    expect(preview.orientation).toBeCloseTo(Math.PI / 2);
    expect(preview.extentFeet).toBe(10);
  });

  it('floors the extent at one grid cell so a shape is never zero-sized', () => {
    const preview = computeMeasurementPreview({
      shapeType: 'line',
      origin: { x: 0, y: 0 },
      cursor: { x: 2, y: 2 },
      grid,
    });

    expect(preview.extentFeet).toBe(5);
  });
});

describe('computeAimPreview', () => {
  it('has no orientation for a circle', () => {
    const preview = computeAimPreview({
      shapeType: 'circle',
      origin: { x: 0, y: 0 },
      cursor: { x: 100, y: 100 },
      extentFeet: 20,
    });

    expect(preview.orientation).toBeNull();
    expect(preview.extentFeet).toBe(20);
  });

  it('aims a cone at the cursor without changing its extent', () => {
    const preview = computeAimPreview({
      shapeType: 'cone',
      origin: { x: 0, y: 0 },
      cursor: { x: 0, y: 100 },
      extentFeet: 20,
    });

    expect(preview.orientation).toBeCloseTo(Math.PI / 2);
    expect(preview.extentFeet).toBe(20);
  });

  it('keeps the fixed extent regardless of cursor distance', () => {
    const near = computeAimPreview({
      shapeType: 'line',
      origin: { x: 0, y: 0 },
      cursor: { x: 1, y: 0 },
      extentFeet: 60,
    });
    const far = computeAimPreview({
      shapeType: 'line',
      origin: { x: 0, y: 0 },
      cursor: { x: 1000, y: 0 },
      extentFeet: 60,
    });

    expect(near.extentFeet).toBe(60);
    expect(far.extentFeet).toBe(60);
  });
});

describe('computeShapeFootprint', () => {
  it('draws a circle at the origin with radius = extent', () => {
    const footprint = computeShapeFootprint(
      {
        shapeType: 'circle',
        originX: 10,
        originY: 20,
        extentFeet: 20,
        orientation: null,
      },
      grid,
    );

    expect(footprint).toEqual({ kind: 'circle', cx: 10, cy: 20, radius: 200 });
  });

  it('draws a ruler as a bare two-point line', () => {
    const footprint = computeShapeFootprint(
      {
        shapeType: 'ruler',
        originX: 0,
        originY: 0,
        extentFeet: 10,
        orientation: 0,
      },
      grid,
    );

    expect(footprint.kind).toBe('polygon');
    if (footprint.kind !== 'polygon') throw new Error('unreachable');
    expect(footprint.points).toHaveLength(2);
    expect(footprint.points[1]!.x).toBeCloseTo(100);
    expect(footprint.points[1]!.y).toBeCloseTo(0);
  });

  it('draws a cone whose base width at the far end equals its length', () => {
    const footprint = computeShapeFootprint(
      {
        shapeType: 'cone',
        originX: 0,
        originY: 0,
        extentFeet: 20,
        orientation: 0,
      },
      grid,
    );

    expect(footprint.kind).toBe('polygon');
    if (footprint.kind !== 'polygon') throw new Error('unreachable');
    const [apex, corner1, corner2] = footprint.points;
    expect(apex).toEqual({ x: 0, y: 0 });
    const baseWidth = Math.hypot(
      corner1!.x - corner2!.x,
      corner1!.y - corner2!.y,
    );
    expect(baseWidth).toBeCloseTo(200);
  });

  it('draws a line as a rectangle of the fixed SRD line width', () => {
    const footprint = computeShapeFootprint(
      {
        shapeType: 'line',
        originX: 0,
        originY: 0,
        extentFeet: 20,
        orientation: 0,
      },
      grid,
    );

    expect(footprint.kind).toBe('polygon');
    if (footprint.kind !== 'polygon') throw new Error('unreachable');
    expect(footprint.points).toHaveLength(4);
    // 5 ft wide at 50px/cell = 50px.
    const width = Math.hypot(
      footprint.points[0]!.x - footprint.points[3]!.x,
      footprint.points[0]!.y - footprint.points[3]!.y,
    );
    expect(width).toBeCloseTo(50);
  });

  it('draws a cube as a square with one corner at the origin', () => {
    const footprint = computeShapeFootprint(
      {
        shapeType: 'cube',
        originX: 0,
        originY: 0,
        extentFeet: 10,
        orientation: 0,
      },
      grid,
    );

    expect(footprint.kind).toBe('polygon');
    if (footprint.kind !== 'polygon') throw new Error('unreachable');
    expect(footprint.points[0]).toEqual({ x: 0, y: 0 });
    // Every side should be the same length (100px at 10ft/50px-per-cell).
    const side = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);
    const [p0, p1, p2, p3] = footprint.points;
    expect(side(p0!, p1!)).toBeCloseTo(100);
    expect(side(p1!, p2!)).toBeCloseTo(100);
    expect(side(p2!, p3!)).toBeCloseTo(100);
  });
});

describe('computeShapeLabelAnchor', () => {
  it('anchors a circle label at its far edge', () => {
    expect(
      computeShapeLabelAnchor(
        {
          shapeType: 'circle',
          originX: 0,
          originY: 0,
          extentFeet: 20,
          orientation: null,
        },
        grid,
      ),
    ).toEqual({ x: 200, y: 0 });
  });

  it('anchors a directional shape label at its end point', () => {
    const anchor = computeShapeLabelAnchor(
      {
        shapeType: 'cone',
        originX: 0,
        originY: 0,
        extentFeet: 20,
        orientation: Math.PI / 2,
      },
      grid,
    );

    expect(anchor.x).toBeCloseTo(0);
    expect(anchor.y).toBeCloseTo(200);
  });
});

describe('buildMeasurementLabelText', () => {
  it('shows just the distance when there is no label', () => {
    expect(buildMeasurementLabelText({ extentFeet: 20, label: null })).toBe(
      '20 ft',
    );
  });

  it('prefixes the label when one is set', () => {
    expect(
      buildMeasurementLabelText({ extentFeet: 20, label: 'Fireball' }),
    ).toBe('Fireball · 20 ft');
  });
});

describe('isPointInShapeFootprint', () => {
  const circle = {
    shapeType: 'circle' as const,
    originX: 0,
    originY: 0,
    extentFeet: 20,
    orientation: null,
  };

  it('hits inside a circle and misses outside it', () => {
    expect(isPointInShapeFootprint(circle, grid, { x: 50, y: 0 })).toBe(true);
    expect(isPointInShapeFootprint(circle, grid, { x: 500, y: 0 })).toBe(false);
  });

  it('hits inside a polygon shape (cube)', () => {
    const cube = {
      shapeType: 'cube' as const,
      originX: 0,
      originY: 0,
      extentFeet: 10,
      orientation: 0,
    };

    expect(isPointInShapeFootprint(cube, grid, { x: 50, y: 50 })).toBe(true);
    expect(isPointInShapeFootprint(cube, grid, { x: -50, y: -50 })).toBe(false);
  });

  it('hits near a bare line (ruler) within tolerance, misses further away', () => {
    const ruler = {
      shapeType: 'ruler' as const,
      originX: 0,
      originY: 0,
      extentFeet: 20,
      orientation: 0,
    };

    expect(isPointInShapeFootprint(ruler, grid, { x: 100, y: 1 })).toBe(true);
    expect(isPointInShapeFootprint(ruler, grid, { x: 100, y: 50 })).toBe(false);
  });
});

describe('mapDamageTypesToColor', () => {
  it('assigns a distinct colour per elemental damage type', () => {
    expect(mapDamageTypesToColor(['acid'])).toBe('#8bc34a');
    expect(mapDamageTypesToColor(['fire'])).toBe('#ef5350');
    expect(mapDamageTypesToColor(['cold'])).toBe('#4fc3f7');
    expect(mapDamageTypesToColor(['radiant'])).toBe('#ffd54f');
  });

  it('is case-insensitive', () => {
    expect(mapDamageTypesToColor(['Fire'])).toBe('#ef5350');
  });

  it('uses the first recognised damage type when a spell lists several', () => {
    expect(mapDamageTypesToColor(['fire', 'radiant'])).toBe('#ef5350');
  });

  it('returns null for no damage type or an unrecognised one', () => {
    expect(mapDamageTypesToColor([])).toBeNull();
    expect(mapDamageTypesToColor(['made-up'])).toBeNull();
  });
});

describe('mapSpellShapeType', () => {
  it('maps a sphere to a circle', () => {
    expect(mapSpellShapeType('sphere')).toBe('circle');
  });

  it('maps a cone, line and cube directly', () => {
    expect(mapSpellShapeType('cone')).toBe('cone');
    expect(mapSpellShapeType('line')).toBe('line');
    expect(mapSpellShapeType('cube')).toBe('cube');
  });

  it('falls back to null for an unrecognised or missing shape', () => {
    expect(mapSpellShapeType('mumbo-jumbo')).toBeNull();
    expect(mapSpellShapeType(null)).toBeNull();
  });
});

describe('computeShapeVideoBounds', () => {
  it('bounds a circle at its origin with radius = extent', () => {
    const bounds = computeShapeVideoBounds(
      {
        shapeType: 'circle',
        originX: 10,
        originY: 20,
        extentFeet: 20,
        orientation: null,
      },
      grid,
    );

    expect(bounds).toEqual({ kind: 'circle', cx: 10, cy: 20, radius: 200 });
  });

  it('bounds a cone as a square (base width = length) facing its orientation', () => {
    const bounds = computeShapeVideoBounds(
      {
        shapeType: 'cone',
        originX: 0,
        originY: 0,
        extentFeet: 20,
        orientation: Math.PI / 2,
      },
      grid,
    );

    expect(bounds).toEqual({
      kind: 'rect',
      offsetX: 0,
      offsetY: -100,
      width: 200,
      height: 200,
      rotation: Math.PI / 2,
    });
  });

  it('bounds a line as a thin rectangle the fixed SRD width tall', () => {
    const bounds = computeShapeVideoBounds(
      {
        shapeType: 'line',
        originX: 0,
        originY: 0,
        extentFeet: 20,
        orientation: 0,
      },
      grid,
    );

    expect(bounds.kind).toBe('rect');
    if (bounds.kind !== 'rect') throw new Error('unreachable');
    expect(bounds.width).toBe(200);
    // 5 ft wide at 50px/cell = 50px.
    expect(bounds.height).toBe(50);
  });

  it('bounds a cube as a square with one corner at the origin', () => {
    const bounds = computeShapeVideoBounds(
      {
        shapeType: 'cube',
        originX: 0,
        originY: 0,
        extentFeet: 10,
        orientation: 0,
      },
      grid,
    );

    expect(bounds).toEqual({
      kind: 'rect',
      offsetX: 0,
      offsetY: 0,
      width: 100,
      height: 100,
      rotation: 0,
    });
  });
});

describe('isEffectPlaying', () => {
  it('is playing while the video has not ended, within the wait window', () => {
    expect(
      isEffectPlaying({
        effectStartedAtMs: 1000,
        nowMs: 1500,
        videoEnded: false,
        failed: false,
      }),
    ).toBe(true);
  });

  it('stops once the video itself has ended', () => {
    expect(
      isEffectPlaying({
        effectStartedAtMs: 1000,
        nowMs: 1500,
        videoEnded: true,
        failed: false,
      }),
    ).toBe(false);
  });

  it('gives up once the max-wait window elapses, even if never ended', () => {
    expect(
      isEffectPlaying({
        effectStartedAtMs: 1000,
        nowMs: 1000 + MAX_EFFECT_WAIT_MS - 1,
        videoEnded: false,
        failed: false,
      }),
    ).toBe(true);
    expect(
      isEffectPlaying({
        effectStartedAtMs: 1000,
        nowMs: 1000 + MAX_EFFECT_WAIT_MS + 1,
        videoEnded: false,
        failed: false,
      }),
    ).toBe(false);
  });

  it('is never playing once failed, regardless of timing', () => {
    expect(
      isEffectPlaying({
        effectStartedAtMs: 1000,
        nowMs: 1001,
        videoEnded: false,
        failed: true,
      }),
    ).toBe(false);
  });

  it('is not playing before its own start time', () => {
    expect(
      isEffectPlaying({
        effectStartedAtMs: 5000,
        nowMs: 1000,
        videoEnded: false,
        failed: false,
      }),
    ).toBe(false);
  });
});

describe('shouldLoopSpellEffect', () => {
  it('does not loop an instantaneous spell', () => {
    expect(shouldLoopSpellEffect('instantaneous')).toBe(false);
  });

  it('is case- and whitespace-insensitive', () => {
    expect(shouldLoopSpellEffect(' Instantaneous ')).toBe(false);
  });

  it('loops a spell with a real duration', () => {
    expect(shouldLoopSpellEffect('1 minute')).toBe(true);
    expect(shouldLoopSpellEffect('10 minutes')).toBe(true);
    expect(shouldLoopSpellEffect('until dispelled')).toBe(true);
  });

  it('does not loop when there is no spell at all', () => {
    expect(shouldLoopSpellEffect(null)).toBe(false);
  });
});
