'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import {
  toLibraryImportState,
  type LibraryImportStatus,
} from '~/utils/toLibraryImportState';
import type {
  CreatureSource,
  CreatureSummary,
} from '~/organisms/CreatureLibrary/components/CreatureLibraryView';

export type CreatureLibraryState = {
  isPending: boolean;
  isLibraryImported: boolean;
  creatures: CreatureSummary[];
  search: string;
  setSearch: (search: string) => void;
  source: CreatureSource;
  setSource: (source: CreatureSource) => void;
};

type ToLibraryStateArgs = {
  isStatusPending: boolean;
  isListPending: boolean;
  status: LibraryImportStatus;
  creatures: CreatureSummary[] | undefined;
};

/**
 * The hook's decision logic as a pure function, so the browser-free unit
 * project can test it.
 *
 * The subtlety worth testing: an empty result means two different things
 * depending on whether the library was ever imported, and the view renders a
 * different empty state for each.
 */
export const toLibraryState = ({
  isStatusPending,
  isListPending,
  status,
  creatures,
}: ToLibraryStateArgs): Omit<
  CreatureLibraryState,
  'search' | 'setSearch' | 'source' | 'setSource'
> => ({
  ...toLibraryImportState({ isStatusPending, isListPending, status }),
  creatures: creatures ?? [],
});

/** Builds the union input `encounter.addCreature` expects from either source. */
export const toAddCreatureInput = (
  creature: CreatureSummary,
):
  | { source: 'library'; slug: string; count: number }
  | { source: 'custom'; id: string; count: number } =>
  creature.source === 'library'
    ? { source: 'library', slug: creature.slug, count: 1 }
    : { source: 'custom', id: creature.id, count: 1 };

export const useCreatureLibrary = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<CreatureSource>('all');

  const status = useQuery(trpc.library.status.queryOptions());
  const list = useQuery(
    trpc.library.listCreatures.queryOptions({ search, source }),
  );

  const addCreature = useMutation(
    trpc.encounter.addCreature.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.encounter.get.queryKey(),
        }),
    }),
  );

  return {
    ...toLibraryState({
      isStatusPending: status.isPending,
      isListPending: list.isPending,
      status: status.data,
      creatures: list.data,
    }),
    search,
    setSearch,
    source,
    setSource,
    addCreature: (creature: CreatureSummary) =>
      addCreature.mutate(toAddCreatureInput(creature)),
  };
};
