import {
  isPointInMapRect,
  zoomAtPoint,
  type MapPoint,
  type Viewport,
} from '~/utils/mapViewport';

/**
 * Pure geometry for the draggable "lens" — the rectangle the DM drags on
 * their own canvas, and zooms with the scroll wheel, to control exactly what
 * the player screen shows. Map space throughout, same convention as
 * `~/utils/mapViewport`.
 */

export type LensRect = { x: number; y: number; width: number; height: number };

/** The map-space rectangle a player viewport shows, given their screen size. */
export const computeLensRect = (
  viewport: Viewport,
  screenWidth: number,
  screenHeight: number,
): LensRect => {
  const zoom = viewport.zoom || 1;

  return {
    x: viewport.x,
    y: viewport.y,
    width: screenWidth / zoom,
    height: screenHeight / zoom,
  };
};

/** The inverse of `computeLensRect` — what to persist after a drag commits. */
export const rectToPlayerViewport = (
  rect: LensRect,
  screenWidth: number,
): Viewport => ({
  x: rect.x,
  y: rect.y,
  zoom: screenWidth / (rect.width || 1),
});

/** Whether a map-space point falls inside the lens body. */
export const isPointInLensRect = (rect: LensRect, point: MapPoint): boolean =>
  isPointInMapRect(point, { x: rect.x, y: rect.y }, rect);

/** A move drag: translates x/y by the pointer delta, size unchanged. */
export const moveLensRect = (
  startRect: LensRect,
  delta: { dx: number; dy: number },
): LensRect => ({
  ...startRect,
  x: startRect.x + delta.dx,
  y: startRect.y + delta.dy,
});

/**
 * A wheel-driven resize: zooms the lens's own (implied) viewport toward the
 * cursor's map point, exactly like the DM's own wheel-zoom over the main
 * canvas — this is the original app's resize gesture (scroll while hovering
 * the lens), not a corner-handle drag. Uniform-scale zoom preserves the
 * player screen's aspect ratio automatically, no forcing required.
 */
export const zoomLensAtPoint = (
  rect: LensRect,
  screenWidth: number,
  screenHeight: number,
  mapPoint: MapPoint,
  deltaY: number,
): LensRect => {
  const viewport = rectToPlayerViewport(rect, screenWidth);
  const screenPoint = {
    x: (mapPoint.x - rect.x) * viewport.zoom,
    y: (mapPoint.y - rect.y) * viewport.zoom,
  };
  const nextViewport = zoomAtPoint({ viewport, mapPoint, screenPoint, deltaY });

  return computeLensRect(nextViewport, screenWidth, screenHeight);
};
