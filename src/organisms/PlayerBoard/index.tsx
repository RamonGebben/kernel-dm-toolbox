'use client';

import { PlayerBoardView } from '~/organisms/PlayerBoard/components/PlayerBoardView';
import { usePlayerStream } from '~/hooks/usePlayerStream';

/**
 * Connected boundary for the player screen.
 *
 * It reads only the SSE stream — there is no tRPC query here at all, which is
 * what guarantees this screen can never see more than the filtered payload.
 */
export const PlayerBoard = () => {
  const { isConnected, view } = usePlayerStream();

  return (
    <PlayerBoardView
      isConnected={isConnected}
      roundNumber={view?.roundNumber ?? 0}
      combatants={view?.combatants ?? []}
    />
  );
};
