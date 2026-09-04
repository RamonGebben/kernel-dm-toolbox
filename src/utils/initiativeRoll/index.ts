import { rollInitiative, type RollD20 } from '~/utils/rollDice';

/** The fields the "Roll for initiative" form needs, and nothing else. */
export type InitiativeRollEntry = {
  id: string;
  isPlayerCharacter: boolean;
  /** What the row currently holds — a monster's automatic roll, or 0. */
  initiative: number;
  /** Null for a player character, and for a monster with no bonus upstream. */
  initiativeBonus: number | null;
};

/** Keyed by combatant id; the raw string each number input holds. */
export type InitiativeDrafts = Record<string, string>;

/**
 * What the form starts with.
 *
 * Monsters arrive prefilled with the initiative they rolled when they were
 * added, because the tool rolled it and there is nothing to ask. Player rows
 * start empty: the players are holding physical dice and the DM is about to
 * type what they say (DECISIONS #16).
 */
export const toInitiativeDrafts = (
  entries: readonly InitiativeRollEntry[],
): InitiativeDrafts =>
  Object.fromEntries(
    entries.map(entry => [
      entry.id,
      entry.isPlayerCharacter ? '' : String(entry.initiative),
    ]),
  );

/** Rerolls every monster, leaving whatever the DM typed for the players. */
export const rerollMonsterDrafts = (
  entries: readonly InitiativeRollEntry[],
  drafts: InitiativeDrafts,
  roll?: RollD20,
): InitiativeDrafts =>
  Object.fromEntries(
    entries.map(entry => [
      entry.id,
      entry.isPlayerCharacter
        ? (drafts[entry.id] ?? '')
        : String(rollInitiative(entry.initiativeBonus, roll)),
    ]),
  );

/**
 * The values to send.
 *
 * A blank or unparseable field falls back to what the row already held rather
 * than to zero — a player whose roll the DM has not typed yet keeps their
 * initiative modifier, which is a defensible place in the order, where zero
 * would silently drop them to the bottom.
 */
export const toInitiativeValues = (
  entries: readonly InitiativeRollEntry[],
  drafts: InitiativeDrafts,
): { id: string; initiative: number }[] =>
  entries.map(entry => {
    const parsed = Number.parseInt(drafts[entry.id] ?? '', 10);

    return {
      id: entry.id,
      initiative: Number.isNaN(parsed) ? entry.initiative : parsed,
    };
  });
