import type { MapFogState } from '~/server/db/schema';

/**
 * Defaults a row written before `baselineImage` existed.
 *
 * `fog` is stored as a JSON blob, so adding the field to `MapFogState` needed
 * no migration — but it also means nothing enforces the field's presence on
 * a row written by an older build. Applied at every boundary that hands a
 * map's fog state to a client (`toMapDetail`, `toPlayerMapView`), never at
 * the DB layer itself: a legacy row is left as-is in storage and simply
 * reads as "no baseline yet" until its next compaction writes one.
 */
export const normalizeMapFogState = (fog: MapFogState): MapFogState => ({
  ...fog,
  baselineImage: fog.baselineImage ?? null,
});
