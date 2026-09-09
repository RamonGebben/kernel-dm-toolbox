import type { MapFogState, MapFogStroke } from '~/server/db/schema';

/**
 * Appends one brush gesture's worth of strokes to a map's fog state.
 *
 * The client batches an entire gesture (pointerdown to pointerup) into one
 * call, mirroring the source app's `applyFogUpdate` — one write per stroke,
 * not per point.
 */
export const applyFogStrokeBatch = (
  fog: MapFogState,
  strokes: readonly MapFogStroke[],
): MapFogState => ({
  ...fog,
  strokes: [...fog.strokes, ...strokes],
});
