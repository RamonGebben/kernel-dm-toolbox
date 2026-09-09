import { describe, expect, it } from 'vitest';
import {
  computeGridDistanceFeet,
  computeMeasurementPreview,
  computeShapeFootprint,
  mapSpellShapeType,
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
