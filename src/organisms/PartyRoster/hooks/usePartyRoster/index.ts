'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTRPC } from '~/trpc/react';
import {
  characterClasses,
  type CharacterClass,
} from '~/content/characterOptions';
import type { CharacterFormValues } from '~/molecules/CharacterForm';
import {
  NEW_CHARACTER,
  PARTY_EDITOR_PARAM,
  buildPartyEditorHref,
  toPartyEditorTarget,
} from '~/utils/partyEditorHref';

/** A party member as the Party page reads it. */
export type PartyCharacter = {
  id: string;
  name: string;
  playerName: string | null;
  level: number;
  className: string | null;
  subclass: string | null;
  species: string | null;
  armorClass: number;
  maxHitPoints: number;
  initiativeModifier: number;
  passivePerception: number | null;
  passiveInsight: number | null;
  passiveInvestigation: number | null;
  notes: string | null;
  isActive: boolean;
};

const toFormClass = (className: string | null): CharacterClass | '' =>
  characterClasses.find(known => known === className) ?? '';

/** A stored character as the form's draft: nulls become blank boxes. */
export const toCharacterFormValues = (
  character: PartyCharacter,
): CharacterFormValues => ({
  name: character.name,
  playerName: character.playerName ?? '',
  className: toFormClass(character.className),
  subclass: character.subclass ?? '',
  species: character.species ?? '',
  armorClass: character.armorClass,
  maxHitPoints: character.maxHitPoints,
  initiativeModifier: character.initiativeModifier,
  level: character.level,
  passivePerception: character.passivePerception,
  passiveInsight: character.passiveInsight,
  passiveInvestigation: character.passiveInvestigation,
  notes: character.notes ?? '',
  isActive: character.isActive,
});

/**
 * Maps a form's values onto the mutation input.
 *
 * Pure, and worth testing on its own: blank text has to become `undefined`
 * rather than `''`, or the optional field is stored as a blank string and
 * every consumer has to handle two kinds of "not filled in".
 */
export const toCharacterInput = (values: CharacterFormValues) => ({
  name: values.name.trim(),
  playerName: values.playerName.trim() || undefined,
  armorClass: values.armorClass,
  maxHitPoints: values.maxHitPoints,
  initiativeModifier: values.initiativeModifier,
  level: values.level,
  className: values.className || null,
  subclass: values.subclass.trim() || undefined,
  species: values.species.trim() || undefined,
  isActive: values.isActive,
  passivePerception: values.passivePerception,
  passiveInsight: values.passiveInsight,
  passiveInvestigation: values.passiveInvestigation,
  notes: values.notes.trim() || undefined,
});

/** Active members first, the bench below — each keeps the roster's order. */
export const splitRoster = <TCharacter extends { isActive: boolean }>(
  characters: readonly TCharacter[],
) => ({
  active: characters.filter(character => character.isActive),
  benched: characters.filter(character => !character.isActive),
});

export const usePartyRoster = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const list = useQuery(trpc.characters.list.queryOptions());
  const characters = list.data ?? [];

  const editor = toPartyEditorTarget(
    searchParams.get(PARTY_EDITOR_PARAM),
    list.data,
  );

  const openEditor = (target: string) =>
    router.replace(buildPartyEditorHref(target), { scroll: false });

  const closeEditor = () => router.replace('/party', { scroll: false });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.characters.list.queryKey(),
    });

  const invalidateAndClose = async () => {
    await invalidate();
    closeEditor();
  };

  const create = useMutation(
    trpc.characters.create.mutationOptions({ onSuccess: invalidateAndClose }),
  );

  const update = useMutation(
    trpc.characters.update.mutationOptions({ onSuccess: invalidateAndClose }),
  );

  const remove = useMutation(
    trpc.characters.remove.mutationOptions({ onSuccess: invalidateAndClose }),
  );

  const setActive = useMutation(
    trpc.characters.setActive.mutationOptions({ onSuccess: invalidate }),
  );

  const submit = (values: CharacterFormValues) => {
    const input = toCharacterInput(values);

    if (editor.kind === 'edit') {
      update.mutate({ ...input, id: editor.character.id });
      return;
    }

    create.mutate(input);
  };

  return {
    isPending: list.isPending,
    ...splitRoster(characters),
    editor,
    isSaving: create.isPending || update.isPending,
    isRemoving: remove.isPending,
    updatingId: setActive.isPending ? (setActive.variables?.id ?? null) : null,
    startCreate: () => openEditor(NEW_CHARACTER),
    startEdit: (id: string) => openEditor(id),
    closeEditor,
    submit,
    toggleActive: (character: PartyCharacter) =>
      setActive.mutate({ id: character.id, isActive: !character.isActive }),
    remove: (id: string) => remove.mutate({ id }),
  };
};
