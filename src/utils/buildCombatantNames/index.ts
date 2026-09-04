/**
 * Names for newly added combatants.
 *
 * Four goblins are four rows, so they need telling apart (DECISIONS #16). The
 * rule, chosen to be predictable and to never rename a row that already
 * exists:
 *
 *   - the first and only one of its kind keeps the bare name — "Goblin";
 *   - any add that produces more than one is numbered — "Goblin 1".."Goblin 4";
 *   - adding to an existing group continues from the highest number in use,
 *     counting a bare "Goblin" as 1.
 *
 * Renaming existing combatants mid-fight would be worse than a slightly uneven
 * sequence: the DM has already written "Goblin 2" on a sticky note.
 */
const escapeForRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The numbers already taken for this base name; a bare name counts as 1. */
export const usedNumbersFor = (
  baseName: string,
  existingNames: readonly string[],
): number[] => {
  const pattern = new RegExp(`^${escapeForRegExp(baseName)}(?: (\\d+))?$`);

  return existingNames.reduce<number[]>((used, name) => {
    const match = pattern.exec(name);
    if (!match) return used;

    return [...used, match[1] ? Number(match[1]) : 1];
  }, []);
};

export const buildCombatantNames = ({
  baseName,
  count,
  existingNames = [],
}: {
  baseName: string;
  count: number;
  existingNames?: readonly string[];
}): string[] => {
  if (count < 1) return [];

  const used = usedNumbersFor(baseName, existingNames);

  if (used.length === 0 && count === 1) return [baseName];

  const startAt = used.length === 0 ? 1 : Math.max(...used) + 1;

  return Array.from({ length: count }, (_, index) =>
    used.length === 0 && count === 1
      ? baseName
      : `${baseName} ${startAt + index}`,
  );
};
