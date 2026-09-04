import 'server-only';

import { and, eq, isNull, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import {
  CURRENT_ENCOUNTER_ID,
  combatants,
  creatures,
} from '~/server/db/schema';
import type { Database } from '~/server/db';
import { buildCombatantNames } from '~/utils/buildCombatantNames';
import { rollInitiative } from '~/utils/rollDice';

const inCurrentEncounter = and(
  eq(combatants.encounterId, CURRENT_ENCOUNTER_ID),
  isNull(combatants.deletedAt),
);

/** Appended below everything currently present, so ties keep insertion order. */
export const nextSortOrder = async (db: Database): Promise<number> => {
  const [row] = await db
    .select({ highest: sql<number | null>`max(${combatants.sortOrder})` })
    .from(combatants)
    .where(inCurrentEncounter);

  return (row?.highest ?? -1) + 1;
};

export type AddCreaturesInput = {
  slug: string;
  count: number;
};

/**
 * Puts monsters on the board.
 *
 * Lives here rather than inside the `addCreature` resolver because two callers
 * need it: adding from the creature library, and applying a saved encounter.
 * Duplicating it would mean a saved encounter's goblins were numbered or
 * rolled differently from hand-added ones.
 */
export const addCreaturesToEncounter = async (
  db: Database,
  input: AddCreaturesInput,
) => {
  const creature = await db.query.creatures.findFirst({
    where: eq(creatures.slug, input.slug),
  });

  if (!creature) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'That creature is not in the library.',
    });
  }

  const existing = await db
    .select({ displayName: combatants.displayName })
    .from(combatants)
    .where(inCurrentEncounter);

  const names = buildCombatantNames({
    baseName: creature.name,
    count: input.count,
    existingNames: existing.map(row => row.displayName),
  });

  const startOrder = await nextSortOrder(db);

  return db
    .insert(combatants)
    .values(
      names.map((displayName, index) => ({
        encounterId: CURRENT_ENCOUNTER_ID,
        creatureSlug: creature.slug,
        displayName,
        // Monsters roll for themselves; the book average is the starting hit
        // point total and stays editable.
        initiative: rollInitiative(creature.initiativeBonus),
        currentHitPoints: creature.hitPoints,
        maxHitPoints: creature.hitPoints,
        armorClass: creature.armorClass,
        sortOrder: startOrder + index,
      })),
    )
    .returning();
};
