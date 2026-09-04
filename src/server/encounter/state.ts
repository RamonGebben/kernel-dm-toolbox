import 'server-only';

import { asc, eq, isNull, and } from 'drizzle-orm';
import {
  CURRENT_ENCOUNTER_ID,
  combatantConditions,
  combatants,
  conditions,
  creatures,
  encounters,
  playerCharacters,
} from '~/server/db/schema';
import type { Database } from '~/server/db';
import { sortCombatants } from '~/utils/sortCombatants';
import { toHealthStatus } from '~/utils/applyDamage';
import {
  calculateEncounterDifficulty,
  type DifficultyResult,
} from '~/utils/calculateEncounterDifficulty';

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

export type AppliedCondition = {
  id: string;
  conditionSlug: string;
  name: string;
  roundsRemaining: number | null;
  note: string | null;
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
  /** The monster's precomputed initiative bonus, for a reroll. */
  initiativeBonus: number | null;
  playerCharacterId: string | null;
  isPlayerCharacter: boolean;
  healthStatus: 'healthy' | 'bloodied' | 'unconscious';
  conditions: AppliedCondition[];
  /** Only present for monsters, and only used by the difficulty readout. */
  challengeRating: number | null;
};

export type EncounterState = {
  roundNumber: number;
  activeCombatantId: string | null;
  combatants: EncounterCombatant[];
  /** Derived, not stored — it changes whenever the board does. */
  difficulty: DifficultyResult;
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
      initiativeBonus: creatures.initiativeBonus,
      challengeRating: creatures.challengeRating,
      partyLevel: playerCharacters.level,
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

  const appliedConditions = await db
    .select({
      id: combatantConditions.id,
      combatantId: combatantConditions.combatantId,
      conditionSlug: combatantConditions.conditionSlug,
      name: conditions.name,
      roundsRemaining: combatantConditions.roundsRemaining,
      note: combatantConditions.note,
    })
    .from(combatantConditions)
    .innerJoin(
      conditions,
      eq(combatantConditions.conditionSlug, conditions.slug),
    )
    .where(isNull(combatantConditions.deletedAt))
    .orderBy(asc(conditions.name));

  const difficulty = calculateEncounterDifficulty({
    partyLevels: rows
      .map(row => row.partyLevel)
      .filter((level): level is number => level !== null),
    monsterChallengeRatings: rows
      .map(row => row.challengeRating)
      .filter((rating): rating is number => rating !== null),
  });

  return {
    roundNumber: encounter.roundNumber,
    activeCombatantId: encounter.activeCombatantId,
    difficulty,
    combatants: sortCombatants(rows).map(
      ({ partyLevel: _partyLevel, ...row }) => ({
        ...row,
        isPlayerCharacter: row.playerCharacterId !== null,
        healthStatus: toHealthStatus(row),
        conditions: appliedConditions
          .filter(applied => applied.combatantId === row.id)
          .map(({ combatantId: _combatantId, ...applied }) => applied),
      }),
    ),
  };
};
