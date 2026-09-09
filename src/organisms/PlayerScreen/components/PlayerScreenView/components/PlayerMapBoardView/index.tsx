'use client';

import styled from 'styled-components';
import { EmptyState } from '~/atoms/EmptyState';
import { MapCanvasView } from '~/organisms/MapCanvas/components/MapCanvasView';
import type { Viewport } from '~/utils/mapViewport';
import type { PlayerMapViewMap } from '~/server/maps/toPlayerMapView';

export type PlayerMapBoardViewProps = {
  map: PlayerMapViewMap | null;
  viewport: Viewport;
};

/**
 * The player screen's read-only view of the live map — the same canvas the
 * DM uses, non-interactive and driven entirely by the stream's committed
 * lens, never the DM's own pan/zoom.
 */
export const PlayerMapBoardView = ({ map, viewport }: PlayerMapBoardViewProps) => {
  if (!map) {
    return (
      <Centered>
        <EmptyState
          title="No map yet"
          description="The battle map will appear here once the DM makes one live."
        />
      </Centered>
    );
  }

  return (
    <Wrapper>
      <MapCanvasView
        map={{
          fileUrl: map.fileUrl,
          kind: map.kind,
          nativeWidth: map.nativeWidth,
          nativeHeight: map.nativeHeight,
        }}
        viewport={viewport}
        interactive={false}
        grid={map.grid}
        fog={map.fog}
        fogOpacity={map.fogOpacity}
        backgroundColor={map.backgroundColor}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
`;

const Centered = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;
