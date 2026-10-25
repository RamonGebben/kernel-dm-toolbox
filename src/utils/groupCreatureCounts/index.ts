/** The only fields grouping cares about. Player characters have neither. */
export interface Groupable {
  creatureSlug: string | null;
  customCreatureId: string | null;
}

export interface CreatureCount {
  creatureSlug: string | null;
  customCreatureId: string | null;
  count: number;
  /** First-seen position, so a saved encounter lists monsters as added. */
  sortOrder: number;
}

/** Distinguishes a library slug from a custom id sharing the same string —
 * astronomically unlikely, but the two are different rows either way. */
const toGroupKey = (combatant: Groupable): string | null =>
  combatant.creatureSlug !== null
    ? `library:${combatant.creatureSlug}`
    : combatant.customCreatureId !== null
      ? `custom:${combatant.customCreatureId}`
      : null;

/**
 * Collapses an initiative order into "how many of each monster", from either
 * the library or the DM's own creatures (issue #3).
 *
 * Player characters drop out: a saved encounter is the opposition, not the
 * party (DECISIONS #14). Order is first appearance rather than alphabetical,
 * because that is the order the DM built the fight in and the one they will
 * recognise in a list of presets.
 */
export const groupCreatureCounts = (
  combatants: ReadonlyArray<Groupable>,
): Array<CreatureCount> => {
  const counts = combatants.reduce((grouped, combatant) => {
    const key = toGroupKey(combatant);
    if (key === null) return grouped;

    const existing = grouped.get(key);
    if (existing)
      return grouped.set(key, { ...existing, count: existing.count + 1 });

    return grouped.set(key, {
      creatureSlug: combatant.creatureSlug,
      customCreatureId: combatant.customCreatureId,
      count: 1,
      sortOrder: grouped.size,
    });
  }, new Map<string, CreatureCount>());

  return [...counts.values()];
};
