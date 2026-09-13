'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import {
  toLibraryImportState,
  type LibraryImportStatus,
} from '~/utils/toLibraryImportState';
import type { MultiSelectFilterOption } from '~/atoms/MultiSelectFilter';
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
  sourceOptions: MultiSelectFilterOption[];
  selectedSources: string[];
  setSelectedSources: (sources: string[]) => void;
  typeOptions: MultiSelectFilterOption[];
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
};

/**
 * Fixed rather than derived: unlike creature type, "where did this row come
 * from" is exactly two values by construction, not something the data can
 * grow a third option for.
 */
export const SOURCE_FILTER_OPTIONS: MultiSelectFilterOption[] = [
  { value: 'library', label: 'Library' },
  { value: 'custom', label: 'Custom' },
];

/**
 * The multi-select's selection as a pure function of the source filter, so
 * the browser-free unit project can test it. Mirrors the level/class filters'
 * convention: no boxes checked means "any" — checking neither and checking
 * both are the same query.
 */
export const toCreatureSourceInput = (
  selectedSources: readonly string[],
): CreatureSource => {
  const hasLibrary = selectedSources.includes('library');
  const hasCustom = selectedSources.includes('custom');

  if (hasLibrary && !hasCustom) return 'library';
  if (hasCustom && !hasLibrary) return 'custom';
  return 'all';
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
  | 'search'
  | 'setSearch'
  | 'sourceOptions'
  | 'selectedSources'
  | 'setSelectedSources'
  | 'typeOptions'
  | 'selectedTypes'
  | 'setSelectedTypes'
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
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const status = useQuery(trpc.library.status.queryOptions());
  const types = useQuery(trpc.library.listCreatureTypes.queryOptions());
  const list = useQuery(
    trpc.library.listCreatures.queryOptions({
      search,
      source: toCreatureSourceInput(selectedSources),
      types: selectedTypes,
    }),
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
    sourceOptions: SOURCE_FILTER_OPTIONS,
    selectedSources,
    setSelectedSources,
    typeOptions: types.data ?? [],
    selectedTypes,
    setSelectedTypes,
    addCreature: (creature: CreatureSummary) =>
      addCreature.mutate(toAddCreatureInput(creature)),
  };
};
