import { toMapDetail } from '~/server/trpc/helpers/toMapDetail';
import type {
  MapAsset,
  MapFogStroke,
  MapMeasurementCursor,
  MapMeasurementPreview,
  MapMeasurementShape,
  MapSession,
  PlayerScreenMode,
  PlayerScreenOrientation,
} from '~/server/db/schema';

export type PlayerMapViewMeasurementShape = {
  id: string;
  shapeType: MapMeasurementShape['shapeType'];
  originX: number;
  originY: number;
  extentFeet: number;
  orientation: number | null;
  label: string | null;
  color: string;
};

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
  measurementShapes: PlayerMapViewMeasurementShape[];
};

export type PlayerMapViewTrackerOverlay = {
  anchorX: number;
  anchorY: number;
  scale: number;
  opacity: number;
  showInitiative: boolean;
  showName: boolean;
  showHealth: boolean;
  showConditions: boolean;
};

export type PlayerMapView = {
  mode: PlayerScreenMode;
  orientation: PlayerScreenOrientation;
  /** Null when nothing is live yet, or the active map has been removed. */
  map: PlayerMapViewMap | null;
  viewport: { x: number; y: number; zoom: number };
  /** Only meaningful in `'both'` mode, but always present — a DM display
   * preference, not player-hidden data, so it needs no filtering here. */
  trackerOverlay: PlayerMapViewTrackerOverlay;
  /** The shape the DM is currently dragging into place, or null when
   * nothing is in progress. Guarded against a stale preview left over from
   * a since-switched-away-from map. */
  livePreviewShape: MapMeasurementPreview | null;
  /** Where the DM's cursor sits while aiming, before there's a shape to
   * preview yet — null once a shape preview exists (it takes over) or
   * nothing is being aimed at all. Same stale-map guard as above. */
  measurementCursor: MapMeasurementCursor | null;
};

/**
 * What the table is allowed to see of the live map session.
 *
 * Mirrors `toPlayerView` on the encounter side: this is the entire payload
 * sent to the player screen, filtered here rather than in a component. The
 * DM's own viewport and fog darkness (`opacityDm`) never appear — only the
 * committed lens (`playerViewport*`) and the table-facing fog opacity do.
 *
 * `measurementShapes` needs no filtering beyond what already exists: every
 * placed shape is meant to be seen, there is no "secret" measurement.
 */
export const toPlayerMapView = (args: {
  session: MapSession;
  map: MapAsset | null;
  measurementShapes: readonly MapMeasurementShape[];
}): PlayerMapView => {
  const { session, map, measurementShapes } = args;

  return {
    mode: session.playerScreenMode,
    orientation: session.playerScreenOrientation,
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
          measurementShapes: measurementShapes.map(shape => ({
            id: shape.id,
            shapeType: shape.shapeType,
            originX: shape.originX,
            originY: shape.originY,
            extentFeet: shape.extentFeet,
            orientation: shape.orientation,
            label: shape.label,
            color: shape.color,
          })),
        }
      : null,
    viewport: {
      x: session.playerViewportX,
      y: session.playerViewportY,
      zoom: session.playerViewportZoom,
    },
    trackerOverlay: {
      anchorX: session.trackerOverlayAnchorX,
      anchorY: session.trackerOverlayAnchorY,
      scale: session.trackerOverlayScale,
      opacity: session.trackerOverlayOpacity,
      showInitiative: session.trackerOverlayShowInitiative,
      showName: session.trackerOverlayShowName,
      showHealth: session.trackerOverlayShowHealth,
      showConditions: session.trackerOverlayShowConditions,
    },
    livePreviewShape:
      session.livePreviewShape && session.livePreviewShape.mapId === map?.id
        ? session.livePreviewShape
        : null,
    measurementCursor:
      session.measurementCursor && session.measurementCursor.mapId === map?.id
        ? session.measurementCursor
        : null,
  };
};
