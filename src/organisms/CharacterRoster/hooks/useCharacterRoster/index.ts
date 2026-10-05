'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import type { RosterCharacter } from '~/organisms/CharacterRoster/components/CharacterRosterView';
import type {
  CharacterFormClassPick,
  CharacterFormValues,
} from '~/molecules/CharacterForm';
import { formatClassLabel } from '~/utils/formatClassLabel';

export type EditingTarget = RosterCharacter | 'new' | null;

type ListedCharacter = {
  id: string;
  name: string;
  playerName: string | null;
  level: number;
  armorClass: number;
  maxHitPoints: number;
  initiativeModifier: number;
  characterClassSlug: string | null;
};

type ListedClass = { slug: string; name: string };

/** Pure so the slug→name join is testable without a query client: an
 * unresolved class (still loading, or since removed) reads as "no class"
 * rather than crashing on a missing map entry. */
export const toRosterCharacters = (
  characters: readonly ListedCharacter[],
  classes: readonly ListedClass[],
): RosterCharacter[] => {
  const classNamesBySlug = new Map(classes.map(c => [c.slug, c.name]));

  return characters.map(character => ({
    ...character,
    classLabel: formatClassLabel(
      character.characterClassSlug
        ? (classNamesBySlug.get(character.characterClassSlug) ?? null)
        : null,
      character.level,
    ),
  }));
};

/**
 * Maps a form's values onto the mutation input.
 *
 * Pure, and worth testing on its own: an empty player name has to become
 * `undefined` rather than `''`, or the optional field is stored as a blank
 * string and every consumer has to handle two kinds of "no player".
 */
export const toCharacterInput = (values: CharacterFormValues) => ({
  name: values.name.trim(),
  playerName: values.playerName.trim() || undefined,
  armorClass: values.armorClass,
  maxHitPoints: values.maxHitPoints,
  initiativeModifier: values.initiativeModifier,
  level: values.level,
});

/**
 * Which characters are already in the fight.
 *
 * Pure so the empty and loading cases are pinned: an undefined encounter must
 * read as "nobody is in the fight", never crash a `.includes`.
 */
export const toCombatantCharacterIds = (
  encounter: { combatants: { playerCharacterId: string | null }[] } | undefined,
): string[] =>
  (encounter?.combatants ?? [])
    .map(combatant => combatant.playerCharacterId)
    .filter((id): id is string => id !== null);

export const useCharacterRoster = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [classWizardTarget, setClassWizardTarget] =
    useState<RosterCharacter | null>(null);

  const list = useQuery(trpc.characters.list.queryOptions());
  const encounter = useQuery(trpc.encounter.get.queryOptions());
  const classesQuery = useQuery(
    trpc.library.listCharacterClasses.queryOptions(),
  );

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.characters.list.queryKey(),
    });

  const create = useMutation(
    trpc.characters.create.mutationOptions({
      onSuccess: async () => {
        setEditing(null);
        await invalidate();
      },
    }),
  );

  const update = useMutation(
    trpc.characters.update.mutationOptions({
      onSuccess: async () => {
        setEditing(null);
        await invalidate();
      },
    }),
  );

  const remove = useMutation(
    trpc.characters.remove.mutationOptions({ onSuccess: invalidate }),
  );

  const applyClassTemplate = useMutation(
    trpc.characters.applyClassTemplate.mutationOptions({
      onSuccess: invalidate,
    }),
  );

  const addToEncounter = useMutation(
    trpc.encounter.addCharacter.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.encounter.get.queryKey(),
        }),
    }),
  );

  const submit = (
    values: CharacterFormValues,
    classPick: CharacterFormClassPick,
  ) => {
    const input = toCharacterInput(values);

    if (editing === 'new' || editing === null) {
      create.mutate(input, {
        onSuccess: created => {
          if (!classPick) return;
          applyClassTemplate.mutate({
            id: created.id,
            characterClassSlug: classPick.classSlug,
            subclassSlug: classPick.subclassSlug || undefined,
            level: values.level,
          });
        },
      });
      return;
    }

    update.mutate({ ...input, id: editing.id });
  };

  return {
    isPending: list.isPending,
    combatantCharacterIds: toCombatantCharacterIds(encounter.data),
    isSaving: create.isPending || update.isPending,
    characters: toRosterCharacters(list.data ?? [], classesQuery.data ?? []),
    classOptions: classesQuery.data ?? [],
    editing,
    startCreate: () => setEditing('new'),
    startEdit: (character: RosterCharacter) => setEditing(character),
    cancelEdit: () => setEditing(null),
    submit,
    remove: (id: string) => remove.mutate({ id }),
    addToEncounter: (character: RosterCharacter) =>
      addToEncounter.mutate({
        playerCharacterId: character.id,
        // The player rolls; this is the modifier they add to it, used as a
        // sensible starting value the DM overwrites with the real roll.
        initiative: character.initiativeModifier,
      }),
    classWizardTarget,
    openClassWizard: (character: RosterCharacter) =>
      setClassWizardTarget(character),
    closeClassWizard: () => setClassWizardTarget(null),
  };
};
