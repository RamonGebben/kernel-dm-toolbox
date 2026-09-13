'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';

/**
 * The session row and its active map's id — the "which map is live right
 * now" lookup every map-control panel needs before it can query anything
 * scoped to that map (the map row itself, its fog, its measurement shapes).
 * Callers that also need the map row's own fields run their own
 * `trpc.maps.get` query off `activeMapId`, since not every caller does —
 * `useMeasurementControls` only needs the id, to scope its shapes query.
 */
export const useActiveMap = () => {
  const trpc = useTRPC();
  const session = useQuery(trpc.maps.getSession.queryOptions());
  const activeMapId = session.data?.activeMapId ?? null;

  return { session, activeMapId };
};
