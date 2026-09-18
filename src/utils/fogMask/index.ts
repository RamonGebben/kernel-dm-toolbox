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
