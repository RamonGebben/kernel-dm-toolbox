import type { MapPoint } from '~/utils/mapViewport';

/**
 * Pure geometry for the ruler and spell-area templates — a distance tool and
 * four shapes (circle/sphere, cone, line, cube/square), placed by two clicks
 * on the map canvas. Map space throughout, same convention as
 * `~/utils/mapViewport` and `~/utils/mapLens`.
 *
 * Distance here is deliberately the 5e tabletop convention — grid-square
 * counting, where a diagonal costs the same as an orthogonal move (Chebyshev
 * distance in grid cells) — **not** Euclidean geometry. This differs from the
 * pixel-accurate math everywhere else on this canvas; see issue #1.
 */

export type MeasurementShapeType =
  'ruler' | 'circle' | 'cone' | 'line' | 'cube';

export type GridSpec = { cellSize: number; originX: number; originY: number };

export const FEET_PER_GRID_CELL = 5;

/** Standard 5e area sizes, for the panel's preset buttons. */
export const SIZE_PRESETS_FEET = [5, 10, 15, 20, 30, 40, 60] as const;

/** Fixed width for a `line` shape — the SRD default for line-shaped spells.
 * An open question in issue #1 resolved to a constant rather than a DM-
 * configurable field, since the placement gesture has nowhere to drive a
 * second size from. */
export const LINE_WIDTH_FEET = 5;

/** The origin (and only the origin) snaps to the nearest grid intersection. */
export const snapPointToGrid = (point: MapPoint, grid: GridSpec): MapPoint => {
  const cell = grid.cellSize || 1;
  return {
    x: grid.originX + Math.round((point.x - grid.originX) / cell) * cell,
    y: grid.originY + Math.round((point.y - grid.originY) / cell) * cell,
  };
};

/** Grid-square-counted distance in feet between two map-space points. */
export const computeGridDistanceFeet = (
  origin: MapPoint,
  point: MapPoint,
  grid: GridSpec,
): number => {
  const cell = grid.cellSize || 1;
  const dxCells = Math.round(Math.abs(point.x - origin.x) / cell);
  const dyCells = Math.round(Math.abs(point.y - origin.y) / cell);
  return Math.max(dxCells, dyCells) * FEET_PER_GRID_CELL;
};

/** Feet to map-space pixels, given the map's own grid calibration. */
export const feetToPixels = (feet: number, grid: GridSpec): number =>
  (feet / FEET_PER_GRID_CELL) * (grid.cellSize || 1);

export type MeasurementShapeInput = {
  shapeType: MeasurementShapeType;
  originX: number;
  originY: number;
  extentFeet: number;
  /** Radians. Null for `circle`, which has no direction. */
  orientation: number | null;
};

/**
 * What the DM is currently aiming, computed live from the fixed origin click
 * and the free-moving cursor. Only the extent (distance) snaps to the grid —
 * orientation is a free angle, per issue #1's placement decision.
 */
export const computeMeasurementPreview = ({
  shapeType,
  origin,
  cursor,
  grid,
}: {
  shapeType: MeasurementShapeType;
  origin: MapPoint;
  cursor: MapPoint;
  grid: GridSpec;
}): MeasurementShapeInput => ({
  shapeType,
  originX: origin.x,
  originY: origin.y,
  extentFeet: Math.max(
    FEET_PER_GRID_CELL,
    computeGridDistanceFeet(origin, cursor, grid),
  ),
  orientation:
    shapeType === 'circle'
      ? null
      : Math.atan2(cursor.y - origin.y, cursor.x - origin.x),
});

export type ShapeFootprint =
  | { kind: 'circle'; cx: number; cy: number; radius: number }
  | { kind: 'polygon'; points: MapPoint[] };

/**
 * The drawable footprint of a committed or in-progress shape, in map-space
 * pixels — consumed by the canvas draw code, which cannot itself be unit
 * tested without a real 2D context.
 *
 * - `circle`: a sphere/cylinder/emanation footprint, radius = extent.
 * - `ruler`: a bare line from origin to endpoint, no fill area.
 * - `cone`: an isoceles triangle whose base width at the far end equals its
 *   length, the 5e SRD convention.
 * - `line`: a rectangle of `LINE_WIDTH_FEET` wide, `extent` long.
 * - `cube`: a square face with one corner at the origin, extending along the
 *   orientation by its own side length.
 */
export const computeShapeFootprint = (
  shape: MeasurementShapeInput,
  grid: GridSpec,
): ShapeFootprint => {
  const origin = { x: shape.originX, y: shape.originY };
  const length = feetToPixels(shape.extentFeet, grid);

  if (shape.shapeType === 'circle') {
    return { kind: 'circle', cx: origin.x, cy: origin.y, radius: length };
  }

  const angle = shape.orientation ?? 0;
  const dir = { x: Math.cos(angle), y: Math.sin(angle) };
  const perp = { x: -dir.y, y: dir.x };
  const end = { x: origin.x + dir.x * length, y: origin.y + dir.y * length };

  if (shape.shapeType === 'ruler') {
    return { kind: 'polygon', points: [origin, end] };
  }

  if (shape.shapeType === 'cone') {
    const halfWidth = length / 2;
    return {
      kind: 'polygon',
      points: [
        origin,
        { x: end.x + perp.x * halfWidth, y: end.y + perp.y * halfWidth },
        { x: end.x - perp.x * halfWidth, y: end.y - perp.y * halfWidth },
      ],
    };
  }

  if (shape.shapeType === 'line') {
    const halfWidth = feetToPixels(LINE_WIDTH_FEET, grid) / 2;
    return {
      kind: 'polygon',
      points: [
        { x: origin.x + perp.x * halfWidth, y: origin.y + perp.y * halfWidth },
        { x: end.x + perp.x * halfWidth, y: end.y + perp.y * halfWidth },
        { x: end.x - perp.x * halfWidth, y: end.y - perp.y * halfWidth },
        { x: origin.x - perp.x * halfWidth, y: origin.y - perp.y * halfWidth },
      ],
    };
  }

  // cube
  const corner3 = { x: end.x + perp.x * length, y: end.y + perp.y * length };
  const corner4 = {
    x: origin.x + perp.x * length,
    y: origin.y + perp.y * length,
  };
  return { kind: 'polygon', points: [origin, end, corner3, corner4] };
};

/**
 * Best-effort mapping from Open5e's `shapeType` vocabulary onto this
 * feature's shape enum. Only `sphere` is confirmed against real imported
 * data (see issue #1); the rest are reasonable guesses at the SRD's other
 * area-effect shapes. An unrecognised value returns `null` — the spell just
 * isn't offered for shape/size auto-fill, rather than guessing wrong.
 */
export const mapSpellShapeType = (
  upstreamShapeType: string | null,
): MeasurementShapeType | null => {
  switch (upstreamShapeType) {
    case 'sphere':
    case 'cylinder':
    case 'emanation':
      return 'circle';
    case 'cone':
      return 'cone';
    case 'line':
      return 'line';
    case 'cube':
    case 'square':
      return 'cube';
    default:
      return null;
  }
};
