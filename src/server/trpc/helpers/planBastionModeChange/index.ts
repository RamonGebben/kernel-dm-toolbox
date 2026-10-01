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
};

/**
 * The single party bastion that several per-character ones become. Defenders
 * pool (any member may absorb another's losses), walls add up, and it only
 * counts as fully enclosed if every part already was.
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
});

type SplitInput = {
  /**
   * Who keeps what belongs to nobody in particular: the defender pool, the
   * walls, the storage, rooms no one brought, and building work not tied to
   * one member's facility.
   */
  keeperId: string;
  specialFacilities: readonly {
    id: string;
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
};

/** Where each part of a party bastion goes when it is split back up. */
export const planBastionSplit = ({
  keeperId,
  specialFacilities,
  basicFacilities,
  projects,
  storageItems,
}: SplitInput): BastionSplit => {
  const special = new Map(
    specialFacilities.map(row => [row.id, row.holderCharacterId ?? keeperId]),
  );
  const basic = new Map(
    basicFacilities.map(row => [
      row.id,
      row.contributedByCharacterId ?? keeperId,
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

  return {
    ownerIds,
    specialFacilities: special,
    basicFacilities: basic,
    projects: project,
    storageItems: storage,
  };
};
