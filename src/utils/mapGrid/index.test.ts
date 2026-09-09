import { describe, expect, it } from 'vitest';
import { computeGridLineRange } from '~/utils/mapGrid';

describe('computeGridLineRange', () => {
  it('starts lines on a grid multiple of the cell size, offset by the origin', () => {
    const range = computeGridLineRange({
      viewport: { x: 100, y: 100, zoom: 1 },
      canvasWidth: 800,
      canvasHeight: 600,
      cellSize: 50,
      originX: 10,
      originY: 10,
    });

    expect((range.startX - 10) % 50).toBeCloseTo(0);
    expect((range.startY - 10) % 50).toBeCloseTo(0);
  });

  it('falls back to a 48px cell when none is set', () => {
    const range = computeGridLineRange({
      viewport: { x: 0, y: 0, zoom: 1 },
      canvasWidth: 100,
      canvasHeight: 100,
      cellSize: 0,
      originX: 0,
      originY: 0,
    });

    expect(range.cellSize).toBe(48);
  });

  it('buffers the visible range a tile past each edge', () => {
    const range = computeGridLineRange({
      viewport: { x: 0, y: 0, zoom: 1 },
      canvasWidth: 800,
      canvasHeight: 600,
      cellSize: 50,
      originX: 0,
      originY: 0,
    });

    expect(range.minX).toBe(-800);
    expect(range.maxX).toBe(1600);
    expect(range.minY).toBe(-600);
    expect(range.maxY).toBe(1200);
  });

  it('shrinks the buffered range as zoom increases', () => {
    const range = computeGridLineRange({
      viewport: { x: 0, y: 0, zoom: 2 },
      canvasWidth: 800,
      canvasHeight: 600,
      cellSize: 50,
      originX: 0,
      originY: 0,
    });

    expect(range.maxX).toBe(800);
  });
});
