'use client';

import { useEffect, useState } from 'react';
import type { PlayerMapView } from '~/server/maps/toPlayerMapView';

/**
 * The player screen's map-session data feed — the maps-domain twin of
 * `usePlayerStream`. The frame *is* the data, already filtered on the
 * server, so there is nothing else for this screen to ask for.
 */

export type MapPlayerStreamState = {
  isConnected: boolean;
  view: PlayerMapView | null;
};

/**
 * Parses one frame.
 *
 * A malformed frame must not blank the screen mid-session — returning null
 * keeps the previous view, which is far better than an error at the moment
 * everyone is looking at it.
 */
export const parsePlayerMapViewFrame = (data: string): PlayerMapView | null => {
  try {
    const parsed: unknown = JSON.parse(data);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('mode' in parsed) ||
      !('viewport' in parsed)
    ) {
      return null;
    }

    return parsed as PlayerMapView;
  } catch {
    return null;
  }
};

export const useMapPlayerStream = (): MapPlayerStreamState => {
  const [view, setView] = useState<PlayerMapView | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource('/api/maps/stream');

    const handleMessage = (event: MessageEvent<string>) => {
      const parsed = parsePlayerMapViewFrame(event.data);
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
