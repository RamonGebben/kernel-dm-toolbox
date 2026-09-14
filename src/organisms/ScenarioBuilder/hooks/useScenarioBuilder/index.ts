'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useScenarioSelectionStore } from '~/stores/scenarioSelection';
import type { CreatureOption } from '~/organisms/ScenarioBuilder/components/ScenarioBuilderView';

type ListedCreature = {
  source: 'library' | 'custom';
  name: string;
  challengeRatingLabel: string;
  slug?: string;
  id?: string;
};

/** Merges `library.listCreatures`' two-shape rows (a library row carries
 * `slug`, a custom-creature row carries `id`) into one option the picker can
 * render and submit without caring which table it came from. Pure, so it is
 * testable without a query client. */
export const toCreatureOptions = (
  rows: readonly ListedCreature[],
): CreatureOption[] =>
  rows.map(row =>
    row.source === 'library'
      ? {
          key: `library:${row.slug}`,
          name: row.name,
          challengeRatingLabel: row.challengeRatingLabel,
          source: 'library' as const,
          creatureSlug: row.slug,
        }
      : {
          key: `custom:${row.id}`,
          name: row.name,
          challengeRatingLabel: row.challengeRatingLabel,
          source: 'custom' as const,
          customCreatureId: row.id,
        },
  );

/** The token key namespace `ScenarioBuilderView` uses is `party:<id>` /
 * `monster:<id>` — parsed back out here rather than in the presentational
 * view, which has no business knowing which mutation a key maps to. */
export const parseTokenKey = (
  key: string,
): { kind: 'party' | 'monster'; id: string } | null => {
  const [kind, id] = key.split(':');
  if ((kind === 'party' || kind === 'monster') && id) return { kind, id };
  return null;
};

export const useScenarioBuilder = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const selectedScenarioId = useScenarioSelectionStore(
    state => state.selectedScenarioId,
  );

  const [monsterSearch, setMonsterSearch] = useState('');
  const [armedTokenKey, setArmedTokenKey] = useState<string | null>(null);

  const detail = useQuery({
    ...trpc.simulator.get.queryOptions({ id: selectedScenarioId ?? '' }),
    enabled: selectedScenarioId !== null,
  });

  const roster = useQuery(trpc.characters.list.queryOptions());

  const creaturePicker = useQuery(
    trpc.library.listCreatures.queryOptions({
      search: monsterSearch,
      source: 'all',
    }),
  );

  const invalidateDetail = () => {
    if (!selectedScenarioId) return Promise.resolve();
    return queryClient.invalidateQueries({
      queryKey: trpc.simulator.get.queryKey({ id: selectedScenarioId }),
    });
  };

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: trpc.simulator.list.queryKey() });

  const invalidateBoth = async () => {
    await Promise.all([invalidateDetail(), invalidateList()]);
  };

  const updateScenario = useMutation(
    trpc.simulator.update.mutationOptions({ onSuccess: invalidateBoth }),
  );
  const addPartyMember = useMutation(
    trpc.simulator.addPartyMember.mutationOptions({
      onSuccess: invalidateBoth,
    }),
  );
  const removePartyMember = useMutation(
    trpc.simulator.removePartyMember.mutationOptions({
      onSuccess: invalidateBoth,
    }),
  );
  const setPartyMemberPosition = useMutation(
    trpc.simulator.setPartyMemberPosition.mutationOptions({
      onSuccess: invalidateDetail,
    }),
  );
  const addMonsterEntry = useMutation(
    trpc.simulator.addMonsterEntry.mutationOptions({
      onSuccess: invalidateBoth,
    }),
  );
  const updateMonsterEntryCount = useMutation(
    trpc.simulator.updateMonsterEntryCount.mutationOptions({
      onSuccess: invalidateBoth,
    }),
  );
  const removeMonsterEntry = useMutation(
    trpc.simulator.removeMonsterEntry.mutationOptions({
      onSuccess: invalidateBoth,
    }),
  );
  const setMonsterEntryPosition = useMutation(
    trpc.simulator.setMonsterEntryPosition.mutationOptions({
      onSuccess: invalidateDetail,
    }),
  );

  const placeArmedToken = (position: { x: number; y: number } | null) => {
    if (!armedTokenKey) return;
    const parsed = parseTokenKey(armedTokenKey);
    if (!parsed) return;

    if (parsed.kind === 'party') {
      setPartyMemberPosition.mutate({ id: parsed.id, position });
    } else {
      setMonsterEntryPosition.mutate({ id: parsed.id, position });
    }
    setArmedTokenKey(null);
  };

  const clearPosition = (key: string) => {
    const parsed = parseTokenKey(key);
    if (!parsed) return;

    if (parsed.kind === 'party') {
      setPartyMemberPosition.mutate({ id: parsed.id, position: null });
    } else {
      setMonsterEntryPosition.mutate({ id: parsed.id, position: null });
    }
  };

  return {
    scenario: detail.data?.scenario ?? null,
    isDetailPending: selectedScenarioId !== null && detail.isPending,
    party: detail.data?.party ?? [],
    monsters: detail.data?.monsters ?? [],
    roster: roster.data ?? [],
    creatureOptions: toCreatureOptions(creaturePicker.data ?? []),
    isCreatureOptionsPending: creaturePicker.isPending,
    monsterSearch,
    onMonsterSearchChange: setMonsterSearch,
    armedTokenKey,
    onArmToken: (key: string) =>
      setArmedTokenKey(current => (current === key ? null : key)),
    onPlaceCell: placeArmedToken,
    onClearPosition: clearPosition,
    onUpdateScenario: (values: {
      name: string;
      note: string;
      trialCount: number;
    }) => {
      if (!selectedScenarioId) return;
      updateScenario.mutate({
        id: selectedScenarioId,
        name: values.name,
        note: values.note || undefined,
        trialCount: values.trialCount,
      });
    },
    onAddPartyMember: (playerCharacterId: string) => {
      if (!selectedScenarioId) return;
      addPartyMember.mutate({
        scenarioId: selectedScenarioId,
        playerCharacterId,
      });
    },
    onRemovePartyMember: (id: string) => removePartyMember.mutate({ id }),
    onAddMonsterEntry: (option: CreatureOption) => {
      if (!selectedScenarioId) return;
      addMonsterEntry.mutate({
        scenarioId: selectedScenarioId,
        creatureSlug: option.creatureSlug,
        customCreatureId: option.customCreatureId,
      });
    },
    onUpdateMonsterEntryCount: (id: string, count: number) =>
      updateMonsterEntryCount.mutate({ id, count }),
    onRemoveMonsterEntry: (id: string) => removeMonsterEntry.mutate({ id }),
  };
};
