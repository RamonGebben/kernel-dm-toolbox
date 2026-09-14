import 'server-only';

import { and, eq, isNull, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import {
  CURRENT_ENCOUNTER_ID,
  combatants,
  creatures,
  customCreatures,
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

export type AddCreaturesInput =
  | { source: 'library'; slug: string; count: number }
  | { source: 'custom'; id: string; count: number };

/** The handful of columns a combatant row actually copies from its source. */
type CombatantSource = {
  name: string;
  initiativeBonus: number | null;
  hitPoints: number;
  armorClass: number;
};

const loadCombatantSource = async (
  db: Database,
  input: AddCreaturesInput,
): Promise<CombatantSource> => {
  if (input.source === 'library') {
    const creature = await db.query.creatures.findFirst({
      where: eq(creatures.slug, input.slug),
    });

    if (!creature) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'That creature is not in the library.',
      });
    }

    return creature;
  }

  const customCreature = await db.query.customCreatures.findFirst({
    where: and(
      eq(customCreatures.id, input.id),
      isNull(customCreatures.deletedAt),
    ),
  });

  if (!customCreature) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'That custom creature no longer exists.',
    });
  }

  return customCreature;
};

/**
 * Puts monsters on the board.
 *
 * Lives here rather than inside the `addCreature` resolver because two callers
 * need it: adding from the creature library, and applying a saved encounter.
 * Duplicating it would mean a saved encounter's goblins were numbered or
 * rolled differently from hand-added ones. Accepts either a library slug or a
 * custom creature id (issue #3) — the two sources are resolved to the same
 * handful of fields before anything else happens.
 */
export const addCreaturesToEncounter = async (
  db: Database,
  input: AddCreaturesInput,
) => {
  const source = await loadCombatantSource(db, input);

  const existing = await db
    .select({ displayName: combatants.displayName })
    .from(combatants)
    .where(inCurrentEncounter);

  const names = buildCombatantNames({
    baseName: source.name,
    count: input.count,
    existingNames: existing.map(row => row.displayName),
  });

  const startOrder = await nextSortOrder(db);

  return db
    .insert(combatants)
    .values(
      names.map((displayName, index) => ({
        encounterId: CURRENT_ENCOUNTER_ID,
        creatureSlug: input.source === 'library' ? input.slug : null,
        customCreatureId: input.source === 'custom' ? input.id : null,
        displayName,
        // Monsters roll for themselves; the book average is the starting hit
        // point total and stays editable.
        initiative: rollInitiative(source.initiativeBonus),
        currentHitPoints: source.hitPoints,
        maxHitPoints: source.hitPoints,
        armorClass: source.armorClass,
        sortOrder: startOrder + index,
      })),
    )
    .returning();
};
