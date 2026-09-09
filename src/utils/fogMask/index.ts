export type FogStrokeLike = { radius: number; softness: number };

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
