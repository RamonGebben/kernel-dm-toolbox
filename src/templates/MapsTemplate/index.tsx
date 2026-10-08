'use client';

import type { ReactNode } from 'react';
import { Page } from '~/atoms/Page';
import { CanvasArea } from '~/templates/MapsTemplate/components/CanvasArea';

interface MapsTemplateProps {
  /** The vertical tool rail, injected by the page. */
  navigationSlot: ReactNode;
  canvasSlot: ReactNode;
  /** The floating icon rail + drawer — `MapControlPanel`. */
  controlsSlot: ReactNode;
}

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
