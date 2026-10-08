import type { PlayerCharacter } from '~/server/db/schema';

type CharacterSource = Pick<
  PlayerCharacter,
  'id' | 'name' | 'maxHitPoints' | 'armorClass' | 'isActive'
>;

/**
 * Who "Add all active" brings in: every active member not already in the
 * fight, in the order given (the roster's name order). A benched member is
 * left out; an absent-tonight one is simply not added by hand.
 */
export const pickCharactersToAdd = <TCharacter extends CharacterSource>(
  characters: readonly TCharacter[],
  presentCharacterIds: ReadonlySet<string>,
): TCharacter[] =>
  characters.filter(
    character => character.isActive && !presentCharacterIds.has(character.id),
  );

/**
 * The combatant row a party member becomes. It copies hit points and AC at
 * the moment they join (DECISIONS #15) — editing the character afterwards
 * does not reach into a fight already under way.
 */
export const toCharacterCombatant = (
  character: CharacterSource,
  placement: { encounterId: string; initiative: number; sortOrder: number },
) => ({
  encounterId: placement.encounterId,
  playerCharacterId: character.id,
  displayName: character.name,
  initiative: placement.initiative,
  currentHitPoints: character.maxHitPoints,
  maxHitPoints: character.maxHitPoints,
  armorClass: character.armorClass,
  sortOrder: placement.sortOrder,
});
