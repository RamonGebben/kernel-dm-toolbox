'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useScenarioSelectionStore } from '~/stores/scenarioSelection';

export const useScenarioList = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const list = useQuery(trpc.simulator.list.queryOptions());
  const selectedScenarioId = useScenarioSelectionStore(
    state => state.selectedScenarioId,
  );
  const selectScenario = useScenarioSelectionStore(
    state => state.selectScenario,
  );

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: trpc.simulator.list.queryKey() });

  const create = useMutation(
    trpc.simulator.create.mutationOptions({
      onSuccess: async created => {
        await invalidateList();
        selectScenario(created.id);
      },
    }),
  );

  const remove = useMutation(
    trpc.simulator.remove.mutationOptions({
      onSuccess: async (_result, variables) => {
        await invalidateList();
        if (selectedScenarioId === variables.id) selectScenario(null);
      },
    }),
  );

  return {
    isPending: list.isPending,
    isCreating: create.isPending,
    scenarios: list.data ?? [],
    selectedScenarioId,
    onSelect: selectScenario,
    onCreate: (name: string) => create.mutate({ name }),
    onRemove: (id: string) => remove.mutate({ id }),
  };
};
