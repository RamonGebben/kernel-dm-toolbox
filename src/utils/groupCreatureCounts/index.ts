/** The only field grouping cares about. Player characters have none. */
export type Groupable = {
  creatureSlug: string | null;
};

export type CreatureCount = {
  creatureSlug: string;
  count: number;
  /** First-seen position, so a saved encounter lists monsters as added. */
  sortOrder: number;
};

/**
 * Collapses an initiative order into "how many of each monster".
 *
 * Player characters drop out: a saved encounter is the opposition, not the
 * party (DECISIONS #14). Order is first appearance rather than alphabetical,
 * because that is the order the DM built the fight in and the one they will
 * recognise in a list of presets.
 */
export const groupCreatureCounts = (
  combatants: readonly Groupable[],
): CreatureCount[] => {
  const counts = new Map<string, CreatureCount>();

  for (const combatant of combatants) {
    if (combatant.creatureSlug === null) continue;

    const existing = counts.get(combatant.creatureSlug);

    if (existing) {
      counts.set(combatant.creatureSlug, {
        ...existing,
        count: existing.count + 1,
      });
      continue;
    }

    counts.set(combatant.creatureSlug, {
      creatureSlug: combatant.creatureSlug,
      count: 1,
      sortOrder: counts.size,
    });
  }

  return [...counts.values()];
};
