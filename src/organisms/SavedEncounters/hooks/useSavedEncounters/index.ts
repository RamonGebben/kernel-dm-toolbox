'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import type { SavedEncounterSummary } from '~/organisms/SavedEncounters/components/SavedEncountersView';

/**
 * Whether there is anything worth saving.
 *
 * Pure, because the answer is subtler than "is the board empty": a board with
 * only the party on it has nothing to save, since a preset is the opposition.
 * An absent query result must read as "no", never crash a `.some`.
 */
export const hasSaveableCreatures = (
  encounter:
    | {
        combatants: {
          creatureSlug: string | null;
          customCreatureId: string | null;
        }[];
      }
    | undefined,
): boolean =>
  (encounter?.combatants ?? []).some(
    combatant =>
      combatant.creatureSlug !== null || combatant.customCreatureId !== null,
  );

export const useSavedEncounters = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const list = useQuery(trpc.presets.list.queryOptions());
  const encounter = useQuery(trpc.encounter.get.queryOptions());

  const invalidatePresets = () =>
    queryClient.invalidateQueries({ queryKey: trpc.presets.list.queryKey() });

  const invalidateEncounter = () =>
    queryClient.invalidateQueries({ queryKey: trpc.encounter.get.queryKey() });

  const save = useMutation(
    trpc.presets.saveCurrent.mutationOptions({ onSuccess: invalidatePresets }),
  );
  const addToEncounter = useMutation(
    trpc.presets.addToEncounter.mutationOptions({
      onSuccess: invalidateEncounter,
    }),
  );
  const remove = useMutation(
    trpc.presets.remove.mutationOptions({ onSuccess: invalidatePresets }),
  );

  return {
    isPending: list.isPending,
    isSaving: save.isPending,
    presets: (list.data ?? []) as SavedEncounterSummary[],
    canSaveCurrent: hasSaveableCreatures(encounter.data),
    save: (name: string) => save.mutate({ name }),
    apply: (id: string) => addToEncounter.mutate({ id }),
    remove: (id: string) => remove.mutate({ id }),
  };
};
