'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';

type MapsTemplateProps = {
  /** The vertical tool rail, injected by the page. */
  navigationSlot: ReactNode;
  canvasSlot: ReactNode;
  /** The floating icon rail + drawer — `MapControlPanel`. */
  controlsSlot: ReactNode;
};

/**
 * The Maps DM screen: the battle map fills the entire canvas area edge to
 * edge, with `MapControlPanel` floating over it as a collapsible overlay
 * rather than sitting in a permanent side column — there is nothing here for
 * the map to share layout space with.
 */
export const MapsTemplate = ({
  navigationSlot,
  canvasSlot,
  controlsSlot,
}: MapsTemplateProps) => (
  <Page>
    {navigationSlot}

    <CanvasArea>
      {canvasSlot}
      {controlsSlot}
    </CanvasArea>
  </Page>
);

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;

  ${props => props.theme.media.lg} {
    flex-direction: row;
  }
`;

const CanvasArea = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
`;
