'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useInvalidateBastions } from '~/hooks/useInvalidateBastions';
import { useBastionSelectionStore } from '~/store/bastionSelection';
import {
  orderKeeperCandidates,
  resolveSelectedBastionId,
  toFoundableCharacters,
} from '~/utils/bastionSelection';
import type { FoundBastionValues } from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm';
import type { ModeChange } from '~/organisms/BastionList/components/BastionListView/components/BastionModeSwitch';

export const useBastionList = () => {
  const trpc = useTRPC();
  const selectedId = useBastionSelectionStore(state => state.selectedBastionId);
  const selectBastion = useBastionSelectionStore(state => state.selectBastion);

  const list = useQuery(trpc.bastions.list.queryOptions());
  const characters = useQuery(trpc.characters.list.queryOptions());
  const party = useQuery(trpc.party.get.queryOptions());

  const invalidate = useInvalidateBastions();

  const found = useMutation(
    trpc.bastions.found.mutationOptions({
      onSuccess: async created => {
        await invalidate();
        selectBastion(created.id);
      },
    }),
  );

  const setMode = useMutation(
    trpc.bastions.setMode.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        selectBastion(null);
      },
    }),
  );

  const bastions = list.data ?? [];
  const mode = party.data?.bastionMode ?? 'per-character';

  return {
    isPending: list.isPending || party.isPending,
    mode,
    bastions,
    selectedId: resolveSelectedBastionId(selectedId, bastions),
    foundable: toFoundableCharacters(characters.data ?? [], bastions),
    /** In party mode there is only ever one bastion to found. */
    canFound: mode === 'per-character' || bastions.length === 0,
    activeMembers: orderKeeperCandidates(
      (characters.data ?? [])
        .filter(character => character.isActive)
        .map(({ id, name }) => ({ id, name })),
      bastions[0]?.topHolderId ?? null,
    ),
    isFounding: found.isPending,
    foundError: found.error?.message ?? null,
    isSwitching: setMode.isPending,
    switchError: setMode.error?.message ?? null,
    select: selectBastion,
    found: (values: FoundBastionValues) => found.mutateAsync(values),
    setMode: (change: ModeChange) => setMode.mutateAsync(change),
  };
};
