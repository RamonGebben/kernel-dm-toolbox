'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';

/**
 * Keeps this browser in step with the server's encounter state.
 *
 * A cross-component hook, so it lives in `src/hooks/` rather than beside one
 * component: the DM screen and the player screen both need it.
 *
 * The stream is a *notification*, not a data channel for this screen — a frame
 * arriving simply invalidates the query, and TanStack Query refetches through
 * the normal path. That keeps exactly one way of reading encounter state, and
 * means the DM screen still works if the stream drops.
 */
export const useEncounterStream = (): void => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource('/api/encounter/stream');

    const refresh = () => {
      void queryClient.invalidateQueries({
        queryKey: trpc.encounter.get.queryKey(),
      });
    };

    source.addEventListener('message', refresh);

    return () => {
      source.removeEventListener('message', refresh);
      source.close();
    };
  }, [queryClient, trpc]);
};
