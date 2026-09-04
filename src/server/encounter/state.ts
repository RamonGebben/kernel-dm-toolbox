import 'server-only';

import { asc, eq, isNull, and } from 'drizzle-orm';
import {
  CURRENT_ENCOUNTER_ID,
  combatants,
  creatures,
  encounters,
  playerCharacters,
} from '~/server/db/schema';
import type { Database } from '~/server/db';
import { sortCombatants } from '~/utils/sortCombatants';
import { toHealthStatus } from '~/utils/applyDamage';

/**
 * There is one encounter and it always exists. Creating it lazily on first
 * read means no seed step and no "encounter not found" branch anywhere.
 */
export const ensureEncounter = async (db: Database) => {
  const existing = await db.query.encounters.findFirst({
    where: eq(encounters.id, CURRENT_ENCOUNTER_ID),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(encounters)
    .values({ id: CURRENT_ENCOUNTER_ID })
    .onConflictDoNothing()
    .returning();

  // A concurrent request may have won the insert; either way there is a row.
  return (
    created ??
    (await db.query.encounters.findFirst({
      where: eq(encounters.id, CURRENT_ENCOUNTER_ID),
    }))!
  );
};

export type EncounterCombatant = {
  id: string;
  displayName: string;
  initiative: number;
  currentHitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints: number;
  armorClass: number;
  isHidden: boolean;
  isDelayed: boolean;
  sortOrder: number;
  /** Null for a player character. */
  creatureSlug: string | null;
  playerCharacterId: string | null;
  isPlayerCharacter: boolean;
  healthStatus: 'healthy' | 'bloodied' | 'unconscious';
  /** Only present for monsters, and only used by the difficulty readout. */
  challengeRating: number | null;
};

export type EncounterState = {
  roundNumber: number;
  activeCombatantId: string | null;
  combatants: EncounterCombatant[];
};

/**
 * The whole encounter, ordered. The single read the DM screen and the player
 * view both build on — the player view filters this down further, on the
 * server, before anything is sent.
 */
export const readEncounterState = async (
  db: Database,
): Promise<EncounterState> => {
  const encounter = await ensureEncounter(db);

  const rows = await db
    .select({
      id: combatants.id,
      displayName: combatants.displayName,
      initiative: combatants.initiative,
      currentHitPoints: combatants.currentHitPoints,
      maxHitPoints: combatants.maxHitPoints,
      temporaryHitPoints: combatants.temporaryHitPoints,
      armorClass: combatants.armorClass,
      isHidden: combatants.isHidden,
      isDelayed: combatants.isDelayed,
      sortOrder: combatants.sortOrder,
      creatureSlug: combatants.creatureSlug,
      playerCharacterId: combatants.playerCharacterId,
      challengeRating: creatures.challengeRating,
    })
    .from(combatants)
    .leftJoin(creatures, eq(combatants.creatureSlug, creatures.slug))
    .leftJoin(
      playerCharacters,
      eq(combatants.playerCharacterId, playerCharacters.id),
    )
    .where(
      and(
        eq(combatants.encounterId, CURRENT_ENCOUNTER_ID),
        isNull(combatants.deletedAt),
      ),
    )
    .orderBy(asc(combatants.sortOrder));

  return {
    roundNumber: encounter.roundNumber,
    activeCombatantId: encounter.activeCombatantId,
    combatants: sortCombatants(rows).map(row => ({
      ...row,
      isPlayerCharacter: row.playerCharacterId !== null,
      healthStatus: toHealthStatus(row),
    })),
  };
};
