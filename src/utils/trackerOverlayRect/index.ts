import { isPointInMapRect, type MapPoint } from '~/utils/mapViewport';
import type { LensRect } from '~/utils/mapLens';

/**
 * Pure geometry for the tracker overlay's footprint and position within
 * whatever box it lives in — the player screen's own visible area, and the
 * DM's lens rect on their own canvas. Everything here is normalized to a
 * 0..1 fraction of that box, so the same math drives both a CSS placement
 * and a map-space one.
 */

export type TrackerFootprint = {
  widthFraction: number;
  heightFraction: number;
};

const MAX_FOOTPRINT_FRACTION = 0.9;
const BASE_WIDTH_FRACTION = 0.4;
const BASE_HEIGHT_FRACTION = 0.38;

/** The overlay's size as a fraction of its container, clamped so it can
 * never grow to fill the whole visible area. */
export const trackerFootprint = (scale: number): TrackerFootprint => ({
  widthFraction: Math.min(MAX_FOOTPRINT_FRACTION, BASE_WIDTH_FRACTION * scale),
  heightFraction: Math.min(
    MAX_FOOTPRINT_FRACTION,
    BASE_HEIGHT_FRACTION * scale,
  ),
});

export type TrackerBoxFraction = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Where the overlay sits, as 0..1 fractions of its container. `anchorX`/
 * `anchorY` of 0 flushes it against the container's near edge, 1 against the
 * far edge — so it can never be positioned outside the visible area. */
export const computeTrackerBoxFraction = (
  anchorX: number,
  anchorY: number,
  scale: number,
): TrackerBoxFraction => {
  const { widthFraction, heightFraction } = trackerFootprint(scale);

  return {
    left: anchorX * (1 - widthFraction),
    top: anchorY * (1 - heightFraction),
    width: widthFraction,
    height: heightFraction,
  };
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** The map-space rectangle the tracker overlay occupies within the DM's
 * lens, given the stored anchor/scale — the tracker-domain twin of
 * `computeLensRect`. */
export const computeTrackerRect = (
  lensRect: LensRect,
  anchorX: number,
  anchorY: number,
  scale: number,
): LensRect => {
  const box = computeTrackerBoxFraction(anchorX, anchorY, scale);

  return {
    x: lensRect.x + box.left * lensRect.width,
    y: lensRect.y + box.top * lensRect.height,
    width: box.width * lensRect.width,
    height: box.height * lensRect.height,
  };
};

/** Whether a map-space point falls inside the tracker overlay's rect. */
export const isPointInTrackerRect = (
  rect: LensRect,
  point: MapPoint,
): boolean => isPointInMapRect(point, { x: rect.x, y: rect.y }, rect);

/** A move drag: translates the rect by the pointer delta, clamped so it can
 * never leave the lens it lives in. Size is unchanged — dragging only ever
 * repositions, `trackerOverlayScale` is a separate settings-tab control. */
export const moveTrackerRect = (
  lensRect: LensRect,
  startRect: LensRect,
  delta: { dx: number; dy: number },
): LensRect => {
  const minX = lensRect.x;
  const maxX = lensRect.x + lensRect.width - startRect.width;
  const minY = lensRect.y;
  const maxY = lensRect.y + lensRect.height - startRect.height;

  return {
    ...startRect,
    x: Math.min(Math.max(startRect.x + delta.dx, minX), Math.max(minX, maxX)),
    y: Math.min(Math.max(startRect.y + delta.dy, minY), Math.max(minY, maxY)),
  };
};

/** The inverse of `computeTrackerRect` — what to persist after a drag
 * commits. Derives the footprint straight from the rect/lens sizes rather
 * than taking `scale` as an input, since a drag never changes it. */
export const trackerRectToAnchor = (
  rect: LensRect,
  lensRect: LensRect,
): { anchorX: number; anchorY: number } => {
  const widthFraction = rect.width / (lensRect.width || 1);
  const heightFraction = rect.height / (lensRect.height || 1);
  const leftFraction = (rect.x - lensRect.x) / (lensRect.width || 1);
  const topFraction = (rect.y - lensRect.y) / (lensRect.height || 1);

  return {
    anchorX:
      widthFraction >= 1 ? 0 : clamp01(leftFraction / (1 - widthFraction)),
    anchorY:
      heightFraction >= 1 ? 0 : clamp01(topFraction / (1 - heightFraction)),
  };
};
