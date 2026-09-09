import { describe, expect, it } from 'vitest';
import {
  computeLensRect,
  isPointInLensRect,
  moveLensRect,
  rectToPlayerViewport,
  zoomLensAtPoint,
} from '~/utils/mapLens';

describe('computeLensRect', () => {
  it('sizes the rect from the player screen scaled by zoom', () => {
    const rect = computeLensRect({ x: 100, y: 50, zoom: 2 }, 1920, 1080);

    expect(rect).toEqual({ x: 100, y: 50, width: 960, height: 540 });
  });

  it('falls back to zoom 1 when zoom is falsy', () => {
    const rect = computeLensRect({ x: 0, y: 0, zoom: 0 }, 800, 600);

    expect(rect).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  });
});

describe('rectToPlayerViewport', () => {
  it('inverts computeLensRect', () => {
    const viewport = { x: 100, y: 50, zoom: 2 };
    const rect = computeLensRect(viewport, 1920, 1080);

    expect(rectToPlayerViewport(rect, 1920)).toEqual(viewport);
  });
});

describe('isPointInLensRect', () => {
  const rect = { x: 0, y: 0, width: 200, height: 100 };

  it('is true for a point inside the body', () => {
    expect(isPointInLensRect(rect, { x: 100, y: 50 })).toBe(true);
  });

  it('is true on the boundary', () => {
    expect(isPointInLensRect(rect, { x: 200, y: 100 })).toBe(true);
  });

  it('is false outside the rect', () => {
    expect(isPointInLensRect(rect, { x: 500, y: 500 })).toBe(false);
  });
});

describe('moveLensRect', () => {
  it('translates by the delta, leaving size unchanged', () => {
    const rect = { x: 10, y: 10, width: 100, height: 50 };

    expect(moveLensRect(rect, { dx: 5, dy: -5 })).toEqual({
      x: 15,
      y: 5,
      width: 100,
      height: 50,
    });
  });
});

describe('zoomLensAtPoint', () => {
  it('zooms in toward the cursor, shrinking the rect and keeping the cursor point fixed relative to it', () => {
    const rect = { x: 0, y: 0, width: 1920, height: 1080 };
    const cursor = { x: 960, y: 540 }; // dead center

    const next = zoomLensAtPoint(rect, 1920, 1080, cursor, -200);

    expect(next.width).toBeLessThan(rect.width);
    expect(next.height).toBeLessThan(rect.height);
    // Aspect ratio preserved automatically by uniform scaling.
    expect(next.width / next.height).toBeCloseTo(rect.width / rect.height);
    // The cursor's map point stays under the same relative screen position.
    const relX = (cursor.x - next.x) / next.width;
    const relY = (cursor.y - next.y) / next.height;
    expect(relX).toBeCloseTo(0.5, 5);
    expect(relY).toBeCloseTo(0.5, 5);
  });

  it('zooms out (grows the rect) for a positive deltaY', () => {
    const rect = { x: 0, y: 0, width: 1920, height: 1080 };

    const next = zoomLensAtPoint(rect, 1920, 1080, { x: 960, y: 540 }, 200);

    expect(next.width).toBeGreaterThan(rect.width);
    expect(next.height).toBeGreaterThan(rect.height);
  });

  it('clamps to the min/max zoom the same as the main viewport', () => {
    const tinyRect = { x: 0, y: 0, width: 384, height: 216 }; // zoom 5 for a 1920-wide screen
    const cursor = { x: 192, y: 108 };

    const next = zoomLensAtPoint(tinyRect, 1920, 1080, cursor, -1000);

    // zoom is already at MAX_ZOOM (5) — a further zoom-in must not exceed it.
    expect(1920 / next.width).toBeLessThanOrEqual(5);
  });
});
