'use client';

import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useMapPlayerStream } from '~/hooks/useMapPlayerStream';
import { PlayerScreenView } from '~/organisms/PlayerScreen/components/PlayerScreenView';
import { PlayerScreenStage } from '~/organisms/PlayerScreen/components/PlayerScreenStage';
import { usePhysicalViewportSize } from '~/organisms/PlayerScreen/hooks/usePhysicalViewportSize';
import type { PlayerMapViewTrackerOverlay } from '~/server/maps/toPlayerMapView';

/** Coalesces a resize gesture (a monitor being dragged, a window resized)
 * into one write, the same discipline as the DM's own viewport persistence. */
const RESIZE_DEBOUNCE_MS = 300;

/** Matches `mapSessions`' own tracker overlay column defaults, for the
 * moment before the first SSE frame arrives. */
const DEFAULT_TRACKER_OVERLAY: PlayerMapViewTrackerOverlay = {
  anchorX: 0.98,
  anchorY: 0.98,
  scale: 1,
  opacity: 0.9,
  showInitiative: true,
  showName: true,
  showHealth: true,
  showConditions: false,
};

/**
 * Connected boundary: owns the map session's SSE stream — for `mode` **and**
 * the map payload, so there is exactly one `/api/maps/stream` connection —
 * plus reporting this screen's own measured size back to the session so the
 * DM's lens sizes correctly against it. Wraps every mode in
 * `PlayerScreenStage`, so the DM's orientation override applies regardless of
 * `mode`, then delegates every pixel to `PlayerScreenView`.
 */
export const PlayerScreen = () => {
  const trpc = useTRPC();
  const { isConnected, view } = useMapPlayerStream();
  const physicalSize = usePhysicalViewportSize();

  const mapAreaRef = useRef<HTMLDivElement | null>(null);
  const lastReportedSizeRef = useRef<{ width: number; height: number } | null>(
    null,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setPlayerScreenSize = useMutation(
    trpc.maps.setPlayerScreenSize.mutationOptions(),
  );

  useEffect(() => {
    const node = mapAreaRef.current;
    if (!node) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;

      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      if (
        lastReportedSizeRef.current?.width === width &&
        lastReportedSizeRef.current?.height === height
      ) {
        return;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        lastReportedSizeRef.current = { width, height };
        setPlayerScreenSize.mutate({ width, height });
      }, RESIZE_DEBOUNCE_MS);
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // Re-observes when the mode switches the map area in or out of the DOM.
  }, [view?.mode, setPlayerScreenSize]);

  return (
    <PlayerScreenStage
      physicalSize={physicalSize}
      orientation={view?.orientation ?? 'auto'}
    >
      <PlayerScreenView
        mode={view?.mode ?? 'tracker'}
        map={view?.map ?? null}
        viewport={view?.viewport ?? { x: 0, y: 0, zoom: 1 }}
        isConnected={isConnected}
        mapAreaRef={mapAreaRef}
        trackerOverlay={view?.trackerOverlay ?? DEFAULT_TRACKER_OVERLAY}
        livePreviewShape={view?.livePreviewShape ?? null}
        measurementCursor={view?.measurementCursor ?? null}
      />
    </PlayerScreenStage>
  );
};
