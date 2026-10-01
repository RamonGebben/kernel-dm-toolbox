import type { CreateCharacterInput } from '~/server/trpc/schemas/characters';

/** Blank optional text is stored as null, never as `''`. */
const orNull = (value: string | undefined): string | null => value || null;

/**
 * The columns a create or full update writes.
 *
 * One place for the "blank means null" rule, so every optional text field has
 * a single representation of "not filled in" and no reader has to handle two.
 */
export const toCharacterColumns = (input: CreateCharacterInput) => ({
  name: input.name,
  playerName: orNull(input.playerName),
  armorClass: input.armorClass,
  maxHitPoints: input.maxHitPoints,
  initiativeModifier: input.initiativeModifier,
  level: input.level,
  className: input.className,
  subclass: orNull(input.subclass),
  species: orNull(input.species),
  isActive: input.isActive,
  passivePerception: input.passivePerception,
  passiveInsight: input.passiveInsight,
  passiveInvestigation: input.passiveInvestigation,
  notes: orNull(input.notes),
  gold: input.gold,
});
