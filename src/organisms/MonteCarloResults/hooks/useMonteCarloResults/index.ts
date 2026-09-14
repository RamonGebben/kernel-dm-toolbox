'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useScenarioSelectionStore } from '~/stores/scenarioSelection';

/**
 * Assembles everything `MonteCarloResultsView` needs: the selected
 * scenario's party/monster readiness (the same `simulator.get` query the
 * Build and Battle tabs already read — TanStack Query dedupes it, so all
 * three tabs share one cached fetch), and the `runBatch` mutation (issue #5,
 * milestone 6). A scenario's `lastRunSummary` is part of that same `get`
 * response, so a previous run's results show immediately without a
 * dedicated query of their own.
 */
export const useMonteCarloResults = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const selectedScenarioId = useScenarioSelectionStore(
    state => state.selectedScenarioId,
  );

  const detail = useQuery({
    ...trpc.simulator.get.queryOptions({ id: selectedScenarioId ?? '' }),
    enabled: selectedScenarioId !== null,
  });

  const runBatch = useMutation(
    trpc.simulator.runBatch.mutationOptions({
      onSuccess: () => {
        if (!selectedScenarioId) return;
        queryClient.invalidateQueries({
          queryKey: trpc.simulator.get.queryKey({ id: selectedScenarioId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.simulator.list.queryKey(),
        });
      },
    }),
  );

  const canRun =
    (detail.data?.party.length ?? 0) > 0 &&
    (detail.data?.monsters.length ?? 0) > 0;

  return {
    hasScenario: selectedScenarioId !== null,
    isDetailPending: selectedScenarioId !== null && detail.isPending,
    scenario: detail.data?.scenario ?? null,
    canRun,
    isRunning: runBatch.isPending,
    runErrorMessage: runBatch.error?.message ?? null,
    onRunBatch: (trialCount: number) => {
      if (!selectedScenarioId) return;
      runBatch.mutate({ scenarioId: selectedScenarioId, trialCount });
    },
  };
};
