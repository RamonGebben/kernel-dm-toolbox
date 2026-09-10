'use client';

import type { RefObject } from 'react';
import styled, { css } from 'styled-components';
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
  livePreviewShape: PlayerMapView['livePreviewShape'];
  measurementCursor: PlayerMapView['measurementCursor'];
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

const FullScreen = styled.div`
  position: relative;
  /* Fills its parent frame rather than the physical viewport — under a 90°
   * orientation override the parent's own box no longer matches 100dvh. */
  width: 100%;
  height: 100%;
`;

/**
 * `min-height`, not `height` — projected onto a TV with no controls, so a
 * scrollbar (from a fixed height too short for the current roster) is not
 * an option. The DM's size setting is a floor the box grows past as needed
 * to keep every combatant visible, never a ceiling that clips or scrolls.
 */
const TrackerOverlay = styled.div<{
  $left?: number;
  $right?: number;
  $top?: number;
  $bottom?: number;
  $width: number;
  $height: number;
  $opacity: number;
}>`
  position: absolute;
  ${props =>
    props.$left !== undefined &&
    css`
      left: ${props.$left * 100}%;
    `}
  ${props =>
    props.$right !== undefined &&
    css`
      right: ${props.$right * 100}%;
    `}
  ${props =>
    props.$top !== undefined &&
    css`
      top: ${props.$top * 100}%;
    `}
  ${props =>
    props.$bottom !== undefined &&
    css`
      bottom: ${props.$bottom * 100}%;
    `}
  width: ${props => props.$width * 100}%;
  min-height: ${props => props.$height * 100}%;
  opacity: ${props => props.$opacity};
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
