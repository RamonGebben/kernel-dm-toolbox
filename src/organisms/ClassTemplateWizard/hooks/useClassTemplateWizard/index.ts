'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { toPlayerCharacterCombatDataFormValues } from '~/molecules/PlayerCharacterCombatDataForm/toPlayerCharacterCombatDataFormValues';
import {
  toUpdateCombatDataInput,
  type PlayerCharacterCombatDataFormValues,
  type SpellOption,
} from '~/molecules/PlayerCharacterCombatDataForm';

export type WizardStep = 'pick' | 'edit';

export type PickSubmission = {
  classSlug: string;
  subclassSlug: string;
  level: number;
};

type UseClassTemplateWizardArgs = {
  characterId: string;
  isOpen: boolean;
};

/**
 * Drives `ClassTemplateWizard`'s two steps: pick a class/subclass/level, then
 * edit the materialized actions/spells/slots/resources it produced. Mirrors
 * `useNewCreatureWizard`'s "pick a base, then a structured form" shape.
 *
 * `step` is derived from the character's own data rather than held as state
 * synced via an effect: a PC with a class already applied opens straight to
 * "edit"; `stepOverride` is the one bit of real UI state, set only from the
 * "change class" button so a DM can still get back to the picker.
 */
export const useClassTemplateWizard = ({
  characterId,
  isOpen,
}: UseClassTemplateWizardArgs) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [stepOverride, setStepOverride] = useState<'pick' | null>(null);
  const [pendingApply, setPendingApply] = useState<PickSubmission | null>(null);

  const classesQuery = useQuery({
    ...trpc.library.listCharacterClasses.queryOptions(),
    enabled: isOpen,
  });

  const combatDataQuery = useQuery({
    ...trpc.characters.getCombatData.queryOptions({ id: characterId }),
    enabled: isOpen,
  });

  const character = combatDataQuery.data?.character ?? null;
  const appliedClassSlug = character?.characterClassSlug ?? null;

  const spellsQuery = useQuery({
    ...trpc.library.listSpells.queryOptions({
      classSlugs: appliedClassSlug ? [appliedClassSlug] : [],
      limit: 500,
    }),
    enabled: isOpen && appliedClassSlug !== null,
  });

  const invalidateCharacter = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.characters.getCombatData.queryKey({ id: characterId }),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.characters.list.queryKey(),
      }),
    ]);

  const applyClassTemplate = useMutation(
    trpc.characters.applyClassTemplate.mutationOptions({
      onSuccess: async () => {
        setStepOverride(null);
        setPendingApply(null);
        await invalidateCharacter();
      },
    }),
  );

  const updateCombatData = useMutation(
    trpc.characters.updateCombatData.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.characters.getCombatData.queryKey({ id: characterId }),
        }),
    }),
  );

  const runApply = (submission: PickSubmission) =>
    applyClassTemplate.mutate({
      id: characterId,
      characterClassSlug: submission.classSlug,
      subclassSlug: submission.subclassSlug || undefined,
      level: submission.level,
    });

  /**
   * A PC that already has a class gets a confirmation step first — a
   * re-apply wipes every materialized row, and that should never be a
   * silent side effect of submitting the picker form.
   */
  const submitPick = (submission: PickSubmission) => {
    if (appliedClassSlug) {
      setPendingApply(submission);
      return;
    }

    runApply(submission);
  };

  const step: WizardStep = stepOverride ?? (appliedClassSlug ? 'edit' : 'pick');

  const spellOptions: SpellOption[] = (spellsQuery.data ?? []).map(spell => ({
    slug: spell.slug,
    name: spell.name,
  }));

  const spellNamesBySlug = new Map(
    spellOptions.map(option => [option.slug, option.name]),
  );

  const combatDataInitialValues: PlayerCharacterCombatDataFormValues | null =
    combatDataQuery.data
      ? toPlayerCharacterCombatDataFormValues({
          actions: combatDataQuery.data.actions,
          spells: combatDataQuery.data.spells,
          spellSlots: combatDataQuery.data.spellSlots,
          resources: combatDataQuery.data.resources,
          spellNamesBySlug,
        })
      : null;

  return {
    step,
    isPending: combatDataQuery.isPending || classesQuery.isPending,
    character,
    classes: classesQuery.data ?? [],
    initialClassSlug: character?.characterClassSlug ?? '',
    initialSubclassSlug: character?.subclassSlug ?? '',
    initialLevel: character?.level ?? 1,
    submitPick,
    isConfirmingOverwrite: pendingApply !== null,
    cancelOverwrite: () => setPendingApply(null),
    isApplying: applyClassTemplate.isPending,
    confirmOverwrite: () => {
      if (pendingApply) runApply(pendingApply);
    },
    backToPick: () => setStepOverride('pick'),
    spellOptions,
    combatDataInitialValues,
    isSavingCombatData: updateCombatData.isPending,
    submitCombatData: (values: PlayerCharacterCombatDataFormValues) =>
      updateCombatData.mutate(toUpdateCombatDataInput(characterId, values)),
  };
};
