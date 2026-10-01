'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useBastionSelectionStore } from '~/stores/bastionSelection';
import {
  resolveSelectedBastionId,
  toFoundableCharacters,
} from '~/utils/bastionSelection';
import type { FoundBastionValues } from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm';

export const useBastionList = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const selectedId = useBastionSelectionStore(state => state.selectedBastionId);
  const selectBastion = useBastionSelectionStore(state => state.selectBastion);

  const list = useQuery(trpc.bastions.list.queryOptions());
  const characters = useQuery(trpc.characters.list.queryOptions());

  const found = useMutation(
    trpc.bastions.found.mutationOptions({
      onSuccess: async created => {
        await queryClient.invalidateQueries({
          queryKey: trpc.bastions.list.queryKey(),
        });
        selectBastion(created.id);
      },
    }),
  );

  const bastions = list.data ?? [];

  return {
    isPending: list.isPending,
    bastions,
    selectedId: resolveSelectedBastionId(selectedId, bastions),
    foundable: toFoundableCharacters(characters.data ?? [], bastions),
    isFounding: found.isPending,
    foundError: found.error?.message ?? null,
    select: selectBastion,
    found: (values: FoundBastionValues) => found.mutateAsync(values),
  };
};
