'use client';

import type { PlayerView } from '~/server/encounter/toPlayerView';
import { useEventSourceView } from '~/hooks/useEventSourceView';

/**
 * The player screen's data feed.
 *
 * Unlike the DM screen — where the stream is only a nudge to refetch — here the
 * frame *is* the data. The payload has already been filtered on the server, so
 * there is nothing else for this screen to ask for, and no second request that
 * could return something the stream would not.
 */

export type PlayerStreamState = {
  isConnected: boolean;
  view: PlayerView | null;
};

/**
 * Parses one frame.
 *
 * A malformed frame must not blank the screen mid-session — returning null
 * keeps the previous view on the wall, which is far better than an error at
 * the moment everyone is looking at it.
 */
export const parsePlayerViewFrame = (data: string): PlayerView | null => {
  try {
    const parsed: unknown = JSON.parse(data);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('combatants' in parsed) ||
      !Array.isArray((parsed as PlayerView).combatants)
    ) {
      return null;
    }

    return parsed as PlayerView;
  } catch {
    return null;
  }
};

export const usePlayerStream = (): PlayerStreamState =>
  useEventSourceView<PlayerView>('/api/encounter/stream', parsePlayerViewFrame);
