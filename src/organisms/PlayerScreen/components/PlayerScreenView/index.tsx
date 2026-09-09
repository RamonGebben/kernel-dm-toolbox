'use client';

import type { RefObject } from 'react';
import styled from 'styled-components';
import { PlayerBoard } from '~/organisms/PlayerBoard';
import { PlayerMapBoardView } from '~/organisms/PlayerScreen/components/PlayerScreenView/components/PlayerMapBoardView';
import type { Viewport } from '~/utils/mapViewport';
import type { PlayerMapViewMap } from '~/server/maps/toPlayerMapView';
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
}: PlayerScreenViewProps) => {
  if (mode === 'tracker') return <PlayerBoard />;

  // 'map' and 'both' both keep the map at the full screen size — 'both'
  // layers the tracker on top instead of splitting the screen and shrinking
  // the map to make room for it.
  return (
    <FullScreen ref={mapAreaRef}>
      <PlayerMapBoardView map={map} viewport={viewport} />
      {!isConnected && <Reconnecting>Reconnecting…</Reconnecting>}
      {mode === 'both' && (
        <TrackerOverlay
          tabIndex={0}
          role="region"
          aria-label="Initiative order"
        >
          <PlayerBoard />
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

const TrackerOverlay = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  max-height: 45dvh;
  overflow-y: auto;
  background: ${props =>
    `color-mix(in srgb, ${props.theme.color.canvas} 88%, transparent)`};
  backdrop-filter: blur(8px);
  border-top: 1px solid ${props => props.theme.color.border};
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
