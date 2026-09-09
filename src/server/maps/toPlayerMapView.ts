import { toMapDetail } from '~/server/trpc/helpers/toMapDetail';
import type { MapAsset, MapFogStroke, MapSession, PlayerScreenMode } from '~/server/db/schema';

export type PlayerMapViewMap = {
  fileUrl: string;
  kind: 'image' | 'video';
  nativeWidth: number | null;
  nativeHeight: number | null;
  grid: {
    visible: boolean;
    color: string;
    opacity: number;
    cellSize: number;
    originX: number;
    originY: number;
  };
  backgroundColor: string;
  fog: {
    enabled: boolean;
    baseState: 'covered' | 'revealed';
    strokes: MapFogStroke[];
  };
  fogOpacity: number;
};

export type PlayerMapView = {
  mode: PlayerScreenMode;
  /** Null when nothing is live yet, or the active map has been removed. */
  map: PlayerMapViewMap | null;
  viewport: { x: number; y: number; zoom: number };
};

/**
 * What the table is allowed to see of the live map session.
 *
 * Mirrors `toPlayerView` on the encounter side: this is the entire payload
 * sent to the player screen, filtered here rather than in a component. The
 * DM's own viewport and fog darkness (`opacityDm`) never appear — only the
 * committed lens (`playerViewport*`) and the table-facing fog opacity do.
 */
export const toPlayerMapView = (args: {
  session: MapSession;
  map: MapAsset | null;
}): PlayerMapView => {
  const { session, map } = args;

  return {
    mode: session.playerScreenMode,
    map: map
      ? {
          fileUrl: toMapDetail(map).fileUrl,
          kind: map.kind as 'image' | 'video',
          nativeWidth: map.nativeWidth,
          nativeHeight: map.nativeHeight,
          grid: {
            visible: session.gridVisible,
            color: session.gridColor,
            opacity: session.gridOpacity,
            cellSize: map.gridCellSize ?? 0,
            originX: map.gridOriginX,
            originY: map.gridOriginY,
          },
          backgroundColor: session.gridBackgroundColor,
          fog: {
            enabled: map.fog.enabled,
            baseState: map.fog.baseState,
            strokes: map.fog.strokes,
          },
          fogOpacity: map.fog.opacityTable,
        }
      : null,
    viewport: {
      x: session.playerViewportX,
      y: session.playerViewportY,
      zoom: session.playerViewportZoom,
    },
  };
};
