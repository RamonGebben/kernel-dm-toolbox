import { canFoundBastion } from '~/utils/bastionRules';

/**
 * Which bastion the page shows: the one picked, if it still exists, else the
 * first. A picked bastion that was abandoned falls back rather than leaving
 * the detail panel pointing at nothing.
 */
export const resolveSelectedBastionId = (
  selectedId: string | null,
  bastions: readonly { id: string }[],
): string | null => {
  if (selectedId && bastions.some(({ id }) => id === selectedId))
    return selectedId;

  return bastions[0]?.id ?? null;
};

export type FoundableCharacter = {
  id: string;
  name: string;
  level: number;
  /** False below level 5 — listed, but not pickable, with the reason. */
  canFound: boolean;
};

/**
 * Who could found a bastion: active members without a live one. Below-level
 * members are still listed so the DM sees why they are missing.
 */
export const toFoundableCharacters = (
  characters: readonly {
    id: string;
    name: string;
    level: number;
    isActive: boolean;
  }[],
  bastions: readonly { ownerId: string | null }[],
): FoundableCharacter[] => {
  const owners = new Set(bastions.map(({ ownerId }) => ownerId));

  return characters
    .filter(character => character.isActive && !owners.has(character.id))
    .map(({ id, name, level }) => ({
      id,
      name,
      level,
      canFound: canFoundBastion(level),
    }));
};

/**
 * The member holding the most facilities — the sensible default for who
 * keeps a split party bastion's shared parts. Ties go to whoever comes first.
 */
export const findTopHolder = (
  holderIds: readonly (string | null)[],
): string | null =>
  holderIds
    .filter((id): id is string => id !== null)
    .reduce<{ id: string | null; count: number }>(
      (best, id, _, all) => {
        const count = all.filter(other => other === id).length;
        return count > best.count ? { id, count } : best;
      },
      { id: null, count: 0 },
    ).id;

/** Puts the suggested keeper first, so a dialog defaulting to the first pick gets them. */
export const orderKeeperCandidates = <TMember extends { id: string }>(
  members: readonly TMember[],
  suggestedId: string | null,
): TMember[] => [
  ...members.filter(({ id }) => id === suggestedId),
  ...members.filter(({ id }) => id !== suggestedId),
];
