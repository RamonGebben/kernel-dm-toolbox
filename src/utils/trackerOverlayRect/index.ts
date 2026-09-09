/**
 * Pure geometry for the tracker overlay's footprint and position within
 * whatever box it lives in — the player screen's own visible area today,
 * and (once the DM-canvas drag interaction lands) the DM's lens rect too.
 * Everything here is normalized to a 0..1 fraction of that box, so the same
 * math can drive both a CSS placement and a map-space one.
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
