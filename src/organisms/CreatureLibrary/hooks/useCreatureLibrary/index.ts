'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import type { CreatureSummary } from '~/organisms/CreatureLibrary/components/CreatureLibraryView';

type LibraryStatus = { isImported: boolean } | undefined;

export type CreatureLibraryState = {
  isPending: boolean;
  isLibraryImported: boolean;
  creatures: CreatureSummary[];
  search: string;
  setSearch: (search: string) => void;
};

type ToLibraryStateArgs = {
  isStatusPending: boolean;
  isListPending: boolean;
  status: LibraryStatus;
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
}: ToLibraryStateArgs): Omit<CreatureLibraryState, 'search' | 'setSearch'> => ({
  isPending: isStatusPending || isListPending,
  isLibraryImported: status?.isImported ?? false,
  creatures: creatures ?? [],
});

/** The quantity field is a free text input; nonsense must not reach the API. */
export const clampQuantity = (value: number): number => {
  if (!Number.isFinite(value)) return 1;

  return Math.min(20, Math.max(1, Math.trunc(value)));
};

export const useCreatureLibrary = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState(1);

  const status = useQuery(trpc.library.status.queryOptions());
  const list = useQuery(trpc.library.listCreatures.queryOptions({ search }));

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
    quantity,
    setQuantity: (next: number) => setQuantity(clampQuantity(next)),
    addCreature: (slug: string) =>
      addCreature.mutate({ slug, count: quantity }),
  };
};
