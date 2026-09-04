'use client';

import { useEffect, useState } from 'react';
import type { PlayerView } from '~/server/encounter/toPlayerView';

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

export const usePlayerStream = (): PlayerStreamState => {
  const [view, setView] = useState<PlayerView | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource('/api/encounter/stream');

    const handleMessage = (event: MessageEvent<string>) => {
      const parsed = parsePlayerViewFrame(event.data);
      if (parsed) setView(parsed);
    };

    source.addEventListener('open', () => setIsConnected(true));
    source.addEventListener('message', handleMessage);
    // EventSource reconnects on its own; this only reflects the current state.
    source.addEventListener('error', () => setIsConnected(false));

    return () => {
      source.close();
    };
  }, []);

  return { isConnected, view };
};
