'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import type { RosterCharacter } from '~/organisms/CharacterRoster/components/CharacterRosterView';

/**
 * Which characters are already in the fight.
 *
 * Pure so the empty and loading cases are pinned: an undefined encounter must
 * read as "nobody is in the fight", never crash a `.includes`.
 */
export const toCombatantCharacterIds = (
  encounter:
    { combatants: Array<{ playerCharacterId: string | null }> } | undefined,
): Array<string> =>
  (encounter?.combatants ?? [])
    .map(combatant => combatant.playerCharacterId)
    .filter((id): id is string => id !== null);

/** The pick list: active members only — the bench is managed on /party. */
export const toPickableCharacters = <TCharacter extends { isActive: boolean }>(
  characters: ReadonlyArray<TCharacter>,
): Array<TCharacter> => characters.filter(character => character.isActive);

/**
 * Whether "Add all active" has anyone left to add — so the button can say
 * so instead of firing a request that adds nobody.
 */
export const hasCharactersToAdd = (
  characters: ReadonlyArray<{ id: string }>,
  combatantCharacterIds: ReadonlyArray<string>,
): boolean =>
  characters.some(character => !combatantCharacterIds.includes(character.id));

export const useCharacterRoster = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const list = useQuery(trpc.characters.list.queryOptions());
  const encounter = useQuery(trpc.encounter.get.queryOptions());

  const invalidateEncounter = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.encounter.get.queryKey(),
    });

  const addToEncounter = useMutation(
    trpc.encounter.addCharacter.mutationOptions({
      onSuccess: invalidateEncounter,
    }),
  );

  const addAllActive = useMutation(
    trpc.encounter.addActiveCharacters.mutationOptions({
      onSuccess: invalidateEncounter,
    }),
  );

  const characters = toPickableCharacters(list.data ?? []);
  const combatantCharacterIds = toCombatantCharacterIds(encounter.data);

  return {
    isPending: list.isPending,
    characters,
    combatantCharacterIds,
    canAddAll: hasCharactersToAdd(characters, combatantCharacterIds),
    isAddingAll: addAllActive.isPending,
    addAllActive: () => addAllActive.mutate(),
    addToEncounter: (character: RosterCharacter) =>
      addToEncounter.mutate({
        playerCharacterId: character.id,
        // The player rolls; this is the modifier they add to it, used as a
        // sensible starting value the DM overwrites with the real roll.
        initiative: character.initiativeModifier,
      }),
  };
};
