'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useEncounterStream } from '~/hooks/useEncounterStream';
import type { EncounterCombatantSummary } from '~/organisms/EncounterPanel/components/EncounterView';

type EncounterQueryData =
  | {
      roundNumber: number;
      activeCombatantId: string | null;
      combatants: EncounterCombatantSummary[];
    }
  | undefined;

/**
 * Reads the encounter. Pure, so the defaulting is testable: an absent query
 * result must read as an empty encounter rather than crashing a map().
 */
export const toEncounterState = (data: EncounterQueryData) => ({
  roundNumber: data?.roundNumber ?? 0,
  activeCombatantId: data?.activeCombatantId ?? null,
  combatants: data?.combatants ?? [],
});

export const useEncounter = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Server-authoritative state: this screen and the player screen both render
  // it, so it is never held in component state.
  useEncounterStream();

  const encounter = useQuery(trpc.encounter.get.queryOptions());

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.encounter.get.queryKey(),
    });

  const remove = useMutation(
    trpc.encounter.remove.mutationOptions({ onSuccess: invalidate }),
  );
  const clearMonsters = useMutation(
    trpc.encounter.clearNonPlayerCombatants.mutationOptions({
      onSuccess: invalidate,
    }),
  );

  return {
    isPending: encounter.isPending,
    ...toEncounterState(encounter.data),
    remove: (id: string) => remove.mutate({ id }),
    clearMonsters: () => clearMonsters.mutate(),
  };
};
