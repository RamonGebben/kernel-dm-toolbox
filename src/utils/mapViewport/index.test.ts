import { describe, expect, it } from 'vitest';
import {
  computeCenteredViewport,
  isPointInMapRect,
  panViewport,
  screenToMapPoint,
  zoomAtPoint,
} from '~/utils/mapViewport';

describe('screenToMapPoint', () => {
  it('offsets by the viewport origin and scales by zoom', () => {
    expect(
      screenToMapPoint({ x: 100, y: 200, zoom: 2 }, { x: 50, y: 40 }),
    ).toEqual({ x: 125, y: 220 });
  });

  it('treats a zero zoom as 1x, rather than dividing by zero', () => {
    expect(screenToMapPoint({ x: 0, y: 0, zoom: 0 }, { x: 10, y: 10 })).toEqual(
      { x: 10, y: 10 },
    );
  });
});

describe('panViewport', () => {
  it('moves the viewport opposite the drag direction, scaled by zoom', () => {
    const next = panViewport({
      startViewport: { x: 100, y: 100, zoom: 2 },
      startScreenPoint: { x: 0, y: 0 },
      currentScreenPoint: { x: 20, y: 10 },
    });

    expect(next).toEqual({ x: 90, y: 95, zoom: 2 });
  });
});

describe('zoomAtPoint', () => {
  it('keeps the map point under the cursor after zooming in', () => {
    const viewport = { x: 0, y: 0, zoom: 1 };
    const mapPoint = { x: 100, y: 100 };
    const screenPoint = { x: 100, y: 100 };

    const next = zoomAtPoint({ viewport, mapPoint, screenPoint, deltaY: -100 });

    expect(next.zoom).toBeGreaterThan(1);
    // The same map point, re-projected through the new viewport, lands back
    // on the same screen point.
    expect(next.x + screenPoint.x / next.zoom).toBeCloseTo(mapPoint.x);
    expect(next.y + screenPoint.y / next.zoom).toBeCloseTo(mapPoint.y);
  });

  it('clamps to the configured zoom bounds', () => {
    const viewport = { x: 0, y: 0, zoom: 1 };
    const point = { x: 0, y: 0 };

    const zoomedOut = zoomAtPoint({
      viewport,
      mapPoint: point,
      screenPoint: point,
      deltaY: 100_000,
      minZoom: 0.5,
    });
    expect(zoomedOut.zoom).toBe(0.5);

    const zoomedIn = zoomAtPoint({
      viewport,
      mapPoint: point,
      screenPoint: point,
      deltaY: -100_000,
      maxZoom: 3,
    });
    expect(zoomedIn.zoom).toBe(3);
  });
});

describe('computeCenteredViewport', () => {
  it('fits and centers the media inside the canvas', () => {
    const viewport = computeCenteredViewport({
      canvasWidth: 800,
      canvasHeight: 600,
      mediaWidth: 1600,
      mediaHeight: 1200,
    });

    expect(viewport.zoom).toBeCloseTo(0.5);
    expect(viewport.x).toBeCloseTo(0);
    expect(viewport.y).toBeCloseTo(0);
  });

  it('respects an already-chosen zoom instead of re-fitting', () => {
    const viewport = computeCenteredViewport({
      canvasWidth: 800,
      canvasHeight: 600,
      mediaWidth: 1600,
      mediaHeight: 1200,
      currentZoom: 1,
    });

    expect(viewport.zoom).toBe(1);
  });
});

describe('isPointInMapRect', () => {
  const origin = { x: 10, y: 10 };
  const size = { width: 100, height: 50 };

  it('is true for a point inside the rect', () => {
    expect(isPointInMapRect({ x: 50, y: 30 }, origin, size)).toBe(true);
  });

  it('is true exactly on the boundary', () => {
    expect(isPointInMapRect({ x: 110, y: 60 }, origin, size)).toBe(true);
  });

  it('is false outside the rect', () => {
    expect(isPointInMapRect({ x: 200, y: 200 }, origin, size)).toBe(false);
  });
});
