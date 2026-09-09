'use client';

import type { RefObject } from 'react';
import styled from 'styled-components';
import { PlayerBoard } from '~/organisms/PlayerBoard';
import { TrackerOverlayBoard } from '~/organisms/TrackerOverlayBoard';
import { PlayerMapBoardView } from '~/organisms/PlayerScreen/components/PlayerScreenView/components/PlayerMapBoardView';
import { computeTrackerBoxFraction } from '~/utils/trackerOverlayRect';
import type { Viewport } from '~/utils/mapViewport';
import type {
  PlayerMapViewMap,
  PlayerMapViewTrackerOverlay,
} from '~/server/maps/toPlayerMapView';
import type { PlayerScreenMode } from '~/organisms/SessionControlsPanel/components/SessionControlsView';

export type PlayerScreenViewProps = {
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
};

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

  return (
    <FullScreen ref={mapAreaRef}>
      <PlayerMapBoardView map={map} viewport={viewport} />
      {!isConnected && <Reconnecting>Reconnecting…</Reconnecting>}
      {mode === 'both' && (
        <TrackerOverlay
          tabIndex={0}
          role="region"
          aria-label="Initiative order"
          $left={box.left}
          $top={box.top}
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

const FullScreen = styled.div`
  position: relative;
  /* Fills its parent frame rather than the physical viewport — under a 90°
   * orientation override the parent's own box no longer matches 100dvh. */
  width: 100%;
  height: 100%;
`;

const TrackerOverlay = styled.div<{
  $left: number;
  $top: number;
  $width: number;
  $height: number;
  $opacity: number;
}>`
  position: absolute;
  left: ${props => props.$left * 100}%;
  top: ${props => props.$top * 100}%;
  width: ${props => props.$width * 100}%;
  height: ${props => props.$height * 100}%;
  opacity: ${props => props.$opacity};
  overflow-y: auto;
  background: ${props =>
    `color-mix(in srgb, ${props.theme.color.canvas} 88%, transparent)`};
  backdrop-filter: blur(8px);
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.md};
  box-shadow: ${props => props.theme.shadow.raised};
`;

const Reconnecting = styled.span`
  position: absolute;
  top: ${props => props.theme.space.md};
  right: ${props => props.theme.space.md};
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  background: ${props => props.theme.color.surfaceRaised};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
