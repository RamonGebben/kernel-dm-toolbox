export type FogStrokeLike = { radius: number; softness: number };

/**
 * Above this many uncompacted strokes, the client bakes the mask into
 * `MapFogState.baselineImage` and the server clears `strokes` — see that
 * field's own comment for why an unbounded list is a real problem, not just
 * tidiness. High enough that a single gesture's own batch (capped at 500 by
 * `applyFogStrokesInputSchema`) can't cause back-to-back compactions, low
 * enough that the list never grows into the range where redrawing it from
 * scratch or resending it becomes noticeable.
 */
export const FOG_COMPACTION_STROKE_THRESHOLD = 300;

/** Whether the mask should be baked into a baseline image right now. */
export const shouldCompactFog = (strokeCount: number): boolean =>
  strokeCount >= FOG_COMPACTION_STROKE_THRESHOLD;

/**
 * The inner radius of a circle brush's feather gradient: fully opaque out to
 * this radius, then fading to transparent at `radius`. 0 softness is a hard
 * edge — the inner and outer radii coincide.
 */
export const innerRadiusForStroke = (stroke: FogStrokeLike): number =>
  Math.max(0, stroke.radius * Math.max(0, 1 - stroke.softness));

/** Canvas composite operation for a stroke: reveal erases the mask, cover paints it. */
export const compositeOperationForMode = (
  mode: 'reveal' | 'cover',
): GlobalCompositeOperation =>
  mode === 'reveal' ? 'destination-out' : 'source-over';

/**
 * The fog mask's own backing-canvas resolution is capped at this many pixels
 * on its longer edge, independent of the map image's native resolution — a
 * soft alpha mask doesn't need photo resolution, and a real profiling
 * session on a 12450x12450 map found compositing (and, before that, baking)
 * the mask at full native resolution to be the dominant cost of painting fog
 * at all, regardless of zoom level. High enough that the mask's own pixel
 * grid is still far finer than a typical grid cell, so the cap is never
 * visible as blockiness in a stroke's feathered edge.
 */
export const FOG_MASK_MAX_DIMENSION = 2048;

/**
 * Mask pixels per map pixel: 1 (no downscale) for a map already at or under
 * the cap, otherwise however much shrinks its longer edge down to it.
 */
export const computeFogMaskScale = (
  mapWidth: number,
  mapHeight: number,
): number => {
  const longEdge = Math.max(mapWidth, mapHeight);
  return longEdge > FOG_MASK_MAX_DIMENSION
    ? FOG_MASK_MAX_DIMENSION / longEdge
    : 1;
};

/** The fog mask canvas's own pixel dimensions for a map of this size. */
export const computeFogMaskSize = (
  mapWidth: number,
  mapHeight: number,
): { width: number; height: number } => {
  const scale = computeFogMaskScale(mapWidth, mapHeight);
  return {
    width: Math.max(1, Math.round(mapWidth * scale)),
    height: Math.max(1, Math.round(mapHeight * scale)),
  };
};
