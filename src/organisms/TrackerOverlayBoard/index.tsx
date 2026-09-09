'use client';

import { TrackerOverlayBoardView } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView';
import { usePlayerStream } from '~/hooks/usePlayerStream';
import type { PlayerMapViewTrackerOverlay } from '~/server/maps/toPlayerMapView';

export type TrackerOverlayBoardProps = {
  config: PlayerMapViewTrackerOverlay;
};

/**
 * Connected boundary for the tracker overlay in `'both'` mode — the sibling
 * of `PlayerBoard`, not a modification of it, since `PlayerBoard` is used
 * verbatim, untouched, for standalone `'tracker'` mode. Reads the same
 * `/api/encounter/stream` (a second, independent connection, but the two are
 * never mounted together — this replaces `PlayerBoard` rather than joining
 * it), so it can never see more than the filtered payload either.
 */
export const TrackerOverlayBoard = ({ config }: TrackerOverlayBoardProps) => {
  const { isConnected, view } = usePlayerStream();

  return (
    <TrackerOverlayBoardView
      isConnected={isConnected}
      roundNumber={view?.roundNumber ?? 0}
      combatants={view?.combatants ?? []}
      showInitiative={config.showInitiative}
      showName={config.showName}
      showHealth={config.showHealth}
    />
  );
};
