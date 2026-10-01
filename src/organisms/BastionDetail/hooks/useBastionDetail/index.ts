'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useBastionSelectionStore } from '~/stores/bastionSelection';
import { resolveSelectedBastionId } from '~/utils/bastionSelection';
import type { BastionDetail } from '~/server/trpc/helpers/toBastionDetail';

export type BastionDetailState =
  | { kind: 'pending' }
  /** No bastion exists at all — the list panel explains how to found one. */
  | { kind: 'none' }
  | { kind: 'loaded'; detail: BastionDetail };

/**
 * What the detail panel can show. The list loads first; only once it says a
 * bastion exists does the detail query matter.
 */
export const toBastionDetailState = (
  isListPending: boolean,
  selectedId: string | null,
  detail: BastionDetail | undefined,
): BastionDetailState => {
  if (isListPending) return { kind: 'pending' };
  if (!selectedId) return { kind: 'none' };
  if (!detail || detail.id !== selectedId) return { kind: 'pending' };

  return { kind: 'loaded', detail };
};

/** The most recent failure among the panel's mutations, for one banner. */
export const latestErrorMessage = (
  mutations: readonly {
    error: { message: string } | null;
    submittedAt: number;
  }[],
): string | null =>
  mutations
    .filter(mutation => mutation.error)
    .reduce<{ message: string; at: number } | null>(
      (latest, mutation) =>
        !latest || mutation.submittedAt > latest.at
          ? { message: mutation.error!.message, at: mutation.submittedAt }
          : latest,
      null,
    )?.message ?? null;

export const useBastionDetail = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const pickedId = useBastionSelectionStore(state => state.selectedBastionId);

  const list = useQuery(trpc.bastions.list.queryOptions());
  const selectedId = resolveSelectedBastionId(pickedId, list.data ?? []);

  const detail = useQuery({
    ...trpc.bastions.get.queryOptions({ id: selectedId ?? '' }),
    enabled: selectedId !== null,
  });
  const party = useQuery(trpc.party.get.queryOptions());
  const characters = useQuery(trpc.characters.list.queryOptions());

  /** Bastion writes can move treasury gold and list counts too. */
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.bastions.get.queryKey() }),
      queryClient.invalidateQueries({
        queryKey: trpc.bastions.list.queryKey(),
      }),
      queryClient.invalidateQueries({ queryKey: trpc.party.get.queryKey() }),
    ]);

  const options = { onSuccess: invalidate };

  const update = useMutation(trpc.bastions.update.mutationOptions(options));
  const abandon = useMutation(trpc.bastions.abandon.mutationOptions(options));
  const addSpecial = useMutation(
    trpc.bastions.addSpecialFacility.mutationOptions(options),
  );
  const setVariant = useMutation(
    trpc.bastions.setFacilityVariant.mutationOptions(options),
  );
  const removeSpecial = useMutation(
    trpc.bastions.removeSpecialFacility.mutationOptions(options),
  );
  const addBasic = useMutation(
    trpc.bastions.addBasicFacility.mutationOptions(options),
  );
  const removeBasic = useMutation(
    trpc.bastions.removeBasicFacility.mutationOptions(options),
  );
  const startProject = useMutation(
    trpc.bastions.startProject.mutationOptions(options),
  );
  const finishProject = useMutation(
    trpc.bastions.finishProject.mutationOptions(options),
  );
  const cancelProject = useMutation(
    trpc.bastions.cancelProject.mutationOptions(options),
  );
  const addItem = useMutation(
    trpc.bastions.addStorageItem.mutationOptions(options),
  );
  const claimItem = useMutation(
    trpc.bastions.claimStorageItem.mutationOptions(options),
  );
  const removeItem = useMutation(
    trpc.bastions.removeStorageItem.mutationOptions(options),
  );

  const mutations = [
    update,
    abandon,
    addSpecial,
    setVariant,
    removeSpecial,
    addBasic,
    removeBasic,
    startProject,
    finishProject,
    cancelProject,
    addItem,
    claimItem,
    removeItem,
  ];

  const bastionId = selectedId ?? '';

  return {
    state: toBastionDetailState(list.isPending, selectedId, detail.data),
    treasuryGold: party.data?.treasuryGold ?? 0,
    characters: (characters.data ?? []).map(({ id, name }) => ({ id, name })),
    isSaving: mutations.some(mutation => mutation.isPending),
    error: latestErrorMessage(mutations),
    actions: {
      update: update.mutateAsync,
      abandon: () => abandon.mutate({ id: bastionId }),
      addSpecialFacility: (input: {
        facilityKey: string;
        variant?: string;
        ignoreRequirements: boolean;
      }) => addSpecial.mutateAsync({ ...input, bastionId }),
      setFacilityVariant: (id: string, variant: string | null) =>
        setVariant.mutate({ id, variant }),
      removeSpecialFacility: (id: string) => removeSpecial.mutate({ id }),
      addBasicFacility: (
        input: Omit<Parameters<typeof addBasic.mutate>[0], 'bastionId'>,
      ) => addBasic.mutate({ ...input, bastionId }),
      removeBasicFacility: (id: string) => removeBasic.mutate({ id }),
      startProject: (
        request: Parameters<typeof startProject.mutate>[0]['request'],
      ) => startProject.mutate({ bastionId, request }),
      finishProject: (id: string) => finishProject.mutate({ id }),
      cancelProject: (id: string) => cancelProject.mutate({ id }),
      addStorageItem: (
        input: Omit<Parameters<typeof addItem.mutate>[0], 'bastionId'>,
      ) => addItem.mutate({ ...input, bastionId }),
      claimStorageItem: (id: string, characterId: string | null) =>
        claimItem.mutate({ id, characterId }),
      removeStorageItem: (id: string) => removeItem.mutate({ id }),
    },
  };
};

export type BastionDetailActions = ReturnType<
  typeof useBastionDetail
>['actions'];
