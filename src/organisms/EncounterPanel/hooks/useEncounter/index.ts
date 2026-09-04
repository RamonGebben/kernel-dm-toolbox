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
  const toggleDelay = useMutation(
    trpc.encounter.toggleDelay.mutationOptions({ onSuccess: invalidate }),
  );
  const nextTurn = useMutation(
    trpc.encounter.nextTurn.mutationOptions({ onSuccess: invalidate }),
  );
  const previousTurn = useMutation(
    trpc.encounter.previousTurn.mutationOptions({ onSuccess: invalidate }),
  );
  const damage = useMutation(
    trpc.encounter.damage.mutationOptions({ onSuccess: invalidate }),
  );
  const heal = useMutation(
    trpc.encounter.heal.mutationOptions({ onSuccess: invalidate }),
  );
  const grantTemporary = useMutation(
    trpc.encounter.grantTemporaryHitPoints.mutationOptions({
      onSuccess: invalidate,
    }),
  );
  const update = useMutation(
    trpc.encounter.update.mutationOptions({ onSuccess: invalidate }),
  );

  return {
    isPending: encounter.isPending,
    ...toEncounterState(encounter.data),
    isAdjusting: damage.isPending || heal.isPending || grantTemporary.isPending,
    remove: (id: string) => remove.mutate({ id }),
    clearMonsters: () => clearMonsters.mutate(),
    toggleDelay: (id: string) => toggleDelay.mutate({ id }),
    nextTurn: () => nextTurn.mutate(),
    previousTurn: () => previousTurn.mutate(),
    damage: (id: string, amount: number) => damage.mutate({ id, amount }),
    heal: (id: string, amount: number) => heal.mutate({ id, amount }),
    grantTemporary: (id: string, amount: number) =>
      grantTemporary.mutate({ id, amount }),
    setHidden: (id: string, isHidden: boolean) =>
      update.mutate({ id, isHidden }),
  };
};
