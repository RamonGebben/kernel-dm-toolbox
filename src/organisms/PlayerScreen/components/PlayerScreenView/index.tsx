'use client';

import type { RefObject } from 'react';
import { PlayerBoard } from '~/organisms/PlayerBoard';
import { TrackerOverlayBoard } from '~/organisms/TrackerOverlayBoard';
import { PlayerMapBoardView } from '~/organisms/PlayerScreen/components/PlayerScreenView/components/PlayerMapBoardView';
import { computeTrackerBoxFraction } from '~/utils/trackerOverlayRect';
import type { Viewport } from '~/utils/mapViewport';
import type {
  PlayerMapView,
  PlayerMapViewMap,
  PlayerMapViewTrackerOverlay,
} from '~/server/maps/toPlayerMapView';
import type { PlayerScreenMode } from '~/server/db/schema';
import { FullScreen } from '~/organisms/PlayerScreen/components/PlayerScreenView/components/FullScreen';
import { TrackerOverlay } from '~/organisms/PlayerScreen/components/PlayerScreenView/components/TrackerOverlay';
import { Reconnecting } from '~/organisms/PlayerScreen/components/PlayerScreenView/components/Reconnecting';

export interface PlayerScreenViewProps {
  mode: PlayerScreenMode;
  map: PlayerMapViewMap | null;
  viewport: Viewport;
  /** Whether the map session's own stream is currently connected — the
   * tracker's connection state is `PlayerBoard`'s own concern. */
  isConnected: boolean;
  /** Attached to the map area's wrapper so the connected boundary can measure
   * it and report the result back as the player screen's own size. Only
   * meaningful (and only attached) while a map area is actually rendered. */
  mapAreaRef: RefObject<HTMLDivElement | null>;
  /** Only read in `'both'` mode. */
  trackerOverlay: PlayerMapViewTrackerOverlay;
  livePreviewShape: PlayerMapView['livePreviewShape'];
  measurementCursor: PlayerMapView['measurementCursor'];
}

/**
 * The second screen's layout, switched on the live session's mode. Renders
 * `PlayerBoard` — itself a self-contained connected organism — untouched for
 * the tracker; the same composition `MapsTemplate` already uses for
 * `MapCanvas`/`MapControlPanel`.
 */
export const PlayerScreenView = ({
  mode,
  map,
  viewport,
  isConnected,
  mapAreaRef,
  trackerOverlay,
  livePreviewShape,
  measurementCursor,
}: PlayerScreenViewProps) => {
  if (mode === 'tracker') return <PlayerBoard />;

  // 'map' and 'both' both keep the map at the full screen size — 'both'
  // layers the tracker on top instead of splitting the screen and shrinking
  // the map to make room for it.
  const box = computeTrackerBoxFraction(
    trackerOverlay.anchorX,
    trackerOverlay.anchorY,
    trackerOverlay.scale,
  );

  // The box's floor (`$height`) can be exceeded by a long roster — see
  // `TrackerOverlay`'s own comment. Anchoring from whichever edge is nearer
  // (rather than always `left`/`top`) means that overflow grows toward the
  // screen's center instead of off the far edge: a box anchored bottom-right
  // (the default) grows upward and leftward as combatants are added, so it
  // stays on screen instead of extending past the bottom with no way to
  // scroll to the rest.
  const anchorFromRight = trackerOverlay.anchorX > 0.5;
  const anchorFromBottom = trackerOverlay.anchorY > 0.5;

  return (
    <FullScreen ref={mapAreaRef}>
      <PlayerMapBoardView
        map={map}
        viewport={viewport}
        livePreviewShape={livePreviewShape}
        measurementCursor={measurementCursor}
      />
      {!isConnected && <Reconnecting>Reconnecting…</Reconnecting>}
      {mode === 'both' && (
        <TrackerOverlay
          tabIndex={0}
          role="region"
          aria-label="Initiative order"
          $left={anchorFromRight ? undefined : box.left}
          $right={anchorFromRight ? 1 - box.left - box.width : undefined}
          $top={anchorFromBottom ? undefined : box.top}
          $bottom={anchorFromBottom ? 1 - box.top - box.height : undefined}
          $width={box.width}
          $height={box.height}
          $opacity={trackerOverlay.opacity}
        >
          <TrackerOverlayBoard config={trackerOverlay} />
        </TrackerOverlay>
      )}
    </FullScreen>
  );
};
