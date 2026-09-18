import type { MapFogState } from '~/server/db/schema';

/**
 * `resetFog` and `revealFog` are the same operation with a different
 * `baseState`: flip the base, and discard every stroke painted against the
 * old one along with any baked-in baseline — a baseline is a snapshot of
 * strokes this reset just discarded, so it must not outlive them and
 * resurface under whatever gets painted next.
 */
export const resetFogState = (
  fog: MapFogState,
  baseState: MapFogState['baseState'],
): MapFogState => ({
  ...fog,
  baseState,
  baselineImage: null,
  strokes: [],
});
