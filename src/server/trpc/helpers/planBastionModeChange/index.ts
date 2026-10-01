/**
 * Switching a campaign between one bastion per character and one bastion
 * for the party (DECISIONS #34). Nothing is lost either way: merging keeps
 * who holds each facility, and splitting sends everything back to whoever
 * held or brought it. Pure — the resolver reads the rows, asks these, then
 * re-points them.
 */

type BastionSummary = {
  id: string;
  name: string;
  notes: string | null;
  defenderCount: number;
  wallSquares: number;
  isFullyEnclosed: boolean;
  isArmoryStocked: boolean;
  hasGuestMonster: boolean;
};

/**
 * The single party bastion that several per-character ones become. Defenders
 * pool (any member may absorb another's losses), walls add up, and it only
 * counts as fully enclosed if every part already was. A stocked Armory and a
 * friendly guest monster come along: they still guard the merged bastion.
 */
export const planBastionMerge = (
  bastions: readonly BastionSummary[],
  name: string,
) => ({
  name,
  notes:
    bastions
      .map(bastion => bastion.notes)
      .filter(Boolean)
      .join('\n\n') || null,
  defenderCount: bastions.reduce((total, b) => total + b.defenderCount, 0),
  wallSquares: bastions.reduce((total, b) => total + b.wallSquares, 0),
  isFullyEnclosed:
    bastions.length > 0 && bastions.every(bastion => bastion.isFullyEnclosed),
  isArmoryStocked: bastions.some(bastion => bastion.isArmoryStocked),
  hasGuestMonster: bastions.some(bastion => bastion.hasGuestMonster),
});

type SplitInput = {
  /**
   * Who keeps what belongs to nobody in particular: the defender pool, the
   * walls, the storage, rooms no one brought, and building work not tied to
   * one member's facility.
   */
  keeperId: string;
  /**
   * Characters who can still own a bastion. A facility held — or a room
   * brought — by anyone else (a removed character) goes to the keeper.
   */
  liveCharacterIds: ReadonlySet<string>;
  /** The shared bastion's stocked Armory follows the Armory itself. */
  isArmoryStocked: boolean;
  specialFacilities: readonly {
    id: string;
    facilityKey: string;
    holderCharacterId: string | null;
  }[];
  basicFacilities: readonly {
    id: string;
    contributedByCharacterId: string | null;
  }[];
  /** `facilityId` set for an enlargement; null for a new room or walls. */
  projects: readonly { id: string; facilityId: string | null }[];
  storageItems: readonly { id: string }[];
};

export type BastionSplit = {
  /** Every character who ends up with a bastion, keeper first. */
  ownerIds: string[];
  /** Row id → the character whose bastion it moves to. */
  specialFacilities: Map<string, string>;
  basicFacilities: Map<string, string>;
  projects: Map<string, string>;
  storageItems: Map<string, string>;
  /** Whose new bastion has the stocked Armory; null when none is stocked. */
  stockedArmoryOwnerId: string | null;
};

/** Where each part of a party bastion goes when it is split back up. */
export const planBastionSplit = ({
  keeperId,
  liveCharacterIds,
  isArmoryStocked,
  specialFacilities,
  basicFacilities,
  projects,
  storageItems,
}: SplitInput): BastionSplit => {
  const ownerFor = (characterId: string | null) =>
    characterId && liveCharacterIds.has(characterId) ? characterId : keeperId;

  const special = new Map(
    specialFacilities.map(row => [row.id, ownerFor(row.holderCharacterId)]),
  );
  const basic = new Map(
    basicFacilities.map(row => [
      row.id,
      ownerFor(row.contributedByCharacterId),
    ]),
  );
  // An enlargement follows the facility it enlarges.
  const project = new Map(
    projects.map(row => [
      row.id,
      (row.facilityId &&
        (special.get(row.facilityId) ?? basic.get(row.facilityId))) ||
        keeperId,
    ]),
  );
  const storage = new Map(storageItems.map(row => [row.id, keeperId]));

  const ownerIds = [
    ...new Set([keeperId, ...special.values(), ...basic.values()]),
  ];

  const armory = specialFacilities.find(row => row.facilityKey === 'armory');
  const stockedArmoryOwnerId = isArmoryStocked
    ? armory
      ? special.get(armory.id)!
      : keeperId
    : null;

  return {
    ownerIds,
    specialFacilities: special,
    basicFacilities: basic,
    projects: project,
    storageItems: storage,
    stockedArmoryOwnerId,
  };
};
