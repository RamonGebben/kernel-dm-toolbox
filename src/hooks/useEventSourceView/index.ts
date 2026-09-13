'use client';

import { useEffect, useState } from 'react';

export type EventSourceViewState<T> = {
  isConnected: boolean;
  view: T | null;
};

/**
 * Generic SSE wiring shared by `usePlayerStream` and `useMapPlayerStream`:
 * open an `EventSource`, track its connection state, and parse each frame
 * into a view. The frame *is* the data — already filtered on the server —
 * so there is nothing else for a caller to ask for.
 *
 * `parseFrame` returning null (a malformed frame) keeps the previous view
 * rather than blanking the screen — the player screen is on a wall in front
 * of everyone, and an error at that moment is far worse than a stale frame.
 */
export const useEventSourceView = <T>(
  url: string,
  parseFrame: (data: string) => T | null,
): EventSourceViewState<T> => {
  const [view, setView] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource(url);

    const handleMessage = (event: MessageEvent<string>) => {
      const parsed = parseFrame(event.data);
      if (parsed) setView(parsed);
    };

    source.addEventListener('open', () => setIsConnected(true));
    source.addEventListener('message', handleMessage);
    // EventSource reconnects on its own; this only reflects the current state.
    source.addEventListener('error', () => setIsConnected(false));

    return () => {
      source.close();
    };
  }, [url, parseFrame]);

  return { isConnected, view };
};
