import { describe, expect, it } from 'vitest';
import type { LensRect } from '~/utils/mapLens';
import {
  computeTrackerBoxFraction,
  computeTrackerRect,
  isPointInTrackerRect,
  moveTrackerRect,
  trackerFootprint,
  trackerRectToAnchor,
} from '~/utils/trackerOverlayRect';

const LENS: LensRect = { x: 100, y: 200, width: 1000, height: 800 };

describe('trackerFootprint', () => {
  it('scales linearly at moderate scale factors', () => {
    expect(trackerFootprint(1)).toEqual({
      widthFraction: 0.4,
      heightFraction: 0.38,
    });
    expect(trackerFootprint(0.5)).toEqual({
      widthFraction: 0.2,
      heightFraction: 0.19,
    });
  });

  it('clamps at the maximum footprint so it can never fill its container', () => {
    expect(trackerFootprint(3)).toEqual({
      widthFraction: 0.9,
      heightFraction: 0.9,
    });
  });
});

describe('computeTrackerBoxFraction', () => {
  it('flushes against the near edge at anchor 0', () => {
    expect(computeTrackerBoxFraction(0, 0, 1)).toEqual({
      left: 0,
      top: 0,
      width: 0.4,
      height: 0.38,
    });
  });

  it('flushes against the far edge at anchor 1, never overflowing', () => {
    const box = computeTrackerBoxFraction(1, 1, 1);

    expect(box.left + box.width).toBeCloseTo(1);
    expect(box.top + box.height).toBeCloseTo(1);
  });

  it('positions proportionally within the draggable remainder at a mid anchor', () => {
    const box = computeTrackerBoxFraction(0.5, 0.5, 1);

    expect(box.left).toBeCloseTo(0.3);
    expect(box.top).toBeCloseTo(0.31);
  });
});

describe('computeTrackerRect', () => {
  it('places the rect at the lens origin at anchor 0', () => {
    expect(computeTrackerRect(LENS, 0, 0, 1)).toEqual({
      x: 100,
      y: 200,
      width: 400,
      height: 304,
    });
  });

  it('places the rect flush against the lens far edge at anchor 1', () => {
    const rect = computeTrackerRect(LENS, 1, 1, 1);

    expect(rect.x + rect.width).toBeCloseTo(LENS.x + LENS.width);
    expect(rect.y + rect.height).toBeCloseTo(LENS.y + LENS.height);
  });
});

describe('isPointInTrackerRect', () => {
  const rect = computeTrackerRect(LENS, 0, 0, 1);

  it('is true for a point inside the rect', () => {
    expect(isPointInTrackerRect(rect, { x: 150, y: 250 })).toBe(true);
  });

  it('is false for a point outside the rect', () => {
    expect(isPointInTrackerRect(rect, { x: 900, y: 900 })).toBe(false);
  });
});

describe('moveTrackerRect', () => {
  it('translates the rect by the pointer delta', () => {
    const start = computeTrackerRect(LENS, 0, 0, 1);
    const moved = moveTrackerRect(LENS, start, { dx: 50, dy: 30 });

    expect(moved.x).toBe(start.x + 50);
    expect(moved.y).toBe(start.y + 30);
    expect(moved.width).toBe(start.width);
    expect(moved.height).toBe(start.height);
  });

  it('clamps so the rect can never leave the lens bounds', () => {
    const start = computeTrackerRect(LENS, 0, 0, 1);
    const movedFarLeft = moveTrackerRect(LENS, start, { dx: -10_000, dy: 0 });
    const movedFarRight = moveTrackerRect(LENS, start, { dx: 10_000, dy: 0 });

    expect(movedFarLeft.x).toBe(LENS.x);
    expect(movedFarRight.x).toBe(LENS.x + LENS.width - start.width);
  });
});

describe('trackerRectToAnchor', () => {
  it('round-trips with computeTrackerRect', () => {
    const rect = computeTrackerRect(LENS, 0.3, 0.7, 1.2);
    const anchor = trackerRectToAnchor(rect, LENS);

    expect(anchor.anchorX).toBeCloseTo(0.3);
    expect(anchor.anchorY).toBeCloseTo(0.7);
  });

  it('recovers anchor 0 at the lens origin', () => {
    const rect = computeTrackerRect(LENS, 0, 0, 1);

    expect(trackerRectToAnchor(rect, LENS)).toEqual({
      anchorX: 0,
      anchorY: 0,
    });
  });

  it('recovers anchor 1 at the lens far edge', () => {
    const rect = computeTrackerRect(LENS, 1, 1, 1);
    const anchor = trackerRectToAnchor(rect, LENS);

    expect(anchor.anchorX).toBeCloseTo(1);
    expect(anchor.anchorY).toBeCloseTo(1);
  });
});
