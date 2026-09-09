import type { MapAsset } from '~/server/db/schema';

/**
 * The full map row plus the URL its bytes are actually served from. `maps.get`
 * is the one procedure that needs everything on the row — grid calibration,
 * fog state — to drive the canvas; `maps.list` only needs the gallery summary.
 */
export const toMapDetail = (map: MapAsset) => ({
  ...map,
  fileUrl: `/api/maps/${map.id}/file`,
});
