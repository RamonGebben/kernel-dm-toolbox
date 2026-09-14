'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useSelectionStore } from '~/stores/selection';
import {
  toCreateCustomCreatureInput,
  type CustomCreatureFormValues,
} from '~/molecules/CustomCreatureForm';
import { toCustomCreatureFormValues } from '~/molecules/CustomCreatureForm/toCustomCreatureFormValues';

/**
 * Edit and delete for the custom creature currently shown in the statblock
 * panel (issue #3) — library creatures are read only, so this only ever
 * targets a `customCreatureId`.
 */
export const useCustomCreatureEditor = (customCreatureId: string | null) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const selectCustomCreature = useSelectionStore(
    state => state.selectCustomCreature,
  );
  const [isEditing, setIsEditing] = useState(false);

  const raw = useQuery({
    ...trpc.customCreatures.getRaw.queryOptions({
      id: customCreatureId ?? '',
    }),
    enabled: isEditing && customCreatureId !== null,
  });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.library.listCreatures.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.customCreatures.get.queryKey(),
      }),
    ]);

  const update = useMutation(
    trpc.customCreatures.update.mutationOptions({
      onSuccess: async () => {
        setIsEditing(false);
        await invalidate();
      },
    }),
  );

  const remove = useMutation(
    trpc.customCreatures.remove.mutationOptions({
      onSuccess: async () => {
        selectCustomCreature(null);
        await invalidate();
      },
      // Deletion always succeeds for a live creature, in or out of use — a
      // combatant or saved preset referencing it just drops the reference
      // gracefully (see `presets.list`, `readEncounterState`). This only
      // fires for a genuine failure, e.g. it was already deleted elsewhere.
      onError: error => {
        window.alert(error.message);
      },
    }),
  );

  const initialValues: CustomCreatureFormValues | null = raw.data
    ? toCustomCreatureFormValues({
        creature: {
          ...raw.data.customCreature,
          slug: raw.data.customCreature.id,
        },
        traits: raw.data.traits,
        actions: raw.data.actions,
      })
    : null;

  return {
    isEditing,
    startEdit: () => setIsEditing(true),
    cancelEdit: () => setIsEditing(false),
    isLoadingEdit: isEditing && raw.isPending,
    initialValues,
    isSaving: update.isPending,
    submit: (values: CustomCreatureFormValues) => {
      if (customCreatureId === null) return;
      update.mutate({
        id: customCreatureId,
        ...toCreateCustomCreatureInput(values),
      });
    },
    remove: () => {
      if (customCreatureId === null) return;
      remove.mutate({ id: customCreatureId });
    },
  };
};
