import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import {
  creatures,
  customCreatures,
  playerCharacters,
  simulatorScenarioMonsterEntries,
  simulatorScenarioPartyMembers,
  simulatorScenarios,
} from '~/server/db/schema';
import { idInputSchema } from '~/server/trpc/schemas/common';
import {
  addMonsterEntryInputSchema,
  addPartyMemberInputSchema,
  createScenarioInputSchema,
  runBatchInputSchema,
  scenarioIdInputSchema,
  setMonsterEntryPositionInputSchema,
  setPartyMemberPositionInputSchema,
  updateMonsterEntryCountInputSchema,
  updateScenarioInputSchema,
} from '~/server/trpc/schemas/simulator';
import {
  tombstoneSyncMeta,
  touchSyncMeta,
} from '~/server/trpc/helpers/touchSyncMeta';
import { formatChallengeRating } from '~/utils/formatChallengeRating';
import { loadScenarioCombatants } from '~/server/simulator/loadScenarioCombatants';
import { runEncounter } from '~/server/simulator/engine/runEncounter';
import { aggregateBatchResults } from '~/server/simulator/engine/aggregateBatchResults';
import type { EngineResult } from '~/server/simulator/engine/types';
import type { Database } from '~/server/db';

/** Keeps a per-trial seed inside the RNG's own 31-bit range regardless of
 * how large `baseSeed`/the trial index get. */
const SEED_MODULUS = 2 ** 31;

const isLiveScenario = isNull(simulatorScenarios.deletedAt);
const isLiveMember = isNull(simulatorScenarioPartyMembers.deletedAt);
const isLiveEntry = isNull(simulatorScenarioMonsterEntries.deletedAt);
const isLivePc = isNull(playerCharacters.deletedAt);
const isLiveCustomCreature = isNull(customCreatures.deletedAt);

const loadLiveScenario = async (db: Database, id: string) => {
  const scenario = await db.query.simulatorScenarios.findFirst({
    where: and(eq(simulatorScenarios.id, id), isLiveScenario),
  });

  if (!scenario) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'That scenario no longer exists.',
    });
  }

  return scenario;
};

const loadLivePartyMember = async (db: Database, id: string) => {
  const member = await db.query.simulatorScenarioPartyMembers.findFirst({
    where: and(eq(simulatorScenarioPartyMembers.id, id), isLiveMember),
  });

  if (!member) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'That party member is no longer in this scenario.',
    });
  }

  return member;
};

const loadLiveMonsterEntry = async (db: Database, id: string) => {
  const entry = await db.query.simulatorScenarioMonsterEntries.findFirst({
    where: and(eq(simulatorScenarioMonsterEntries.id, id), isLiveEntry),
  });

  if (!entry) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'That monster entry is no longer in this scenario.',
    });
  }

  return entry;
};

/**
 * Read-only access to how many PCs/monster lines a scenario holds, for the
 * scenario list — the same "counts alongside the row" shape `presets.list`
 * already returns for creature composition.
 */
const listScenarioCounts = async (db: Database, scenarioIds: string[]) => {
  if (!scenarioIds.length)
    return new Map<string, { party: number; monsters: number }>();

  const [members, entries] = await Promise.all([
    db
      .select({ scenarioId: simulatorScenarioPartyMembers.scenarioId })
      .from(simulatorScenarioPartyMembers)
      .where(
        and(
          inArray(simulatorScenarioPartyMembers.scenarioId, scenarioIds),
          isLiveMember,
        ),
      ),
    db
      .select({
        scenarioId: simulatorScenarioMonsterEntries.scenarioId,
        count: simulatorScenarioMonsterEntries.count,
      })
      .from(simulatorScenarioMonsterEntries)
      .where(
        and(
          inArray(simulatorScenarioMonsterEntries.scenarioId, scenarioIds),
          isLiveEntry,
        ),
      ),
  ]);

  const counts = new Map<string, { party: number; monsters: number }>(
    scenarioIds.map(id => [id, { party: 0, monsters: 0 }]),
  );

  for (const member of members) {
    const current = counts.get(member.scenarioId);
    if (current) current.party += 1;
  }

  for (const entry of entries) {
    const current = counts.get(entry.scenarioId);
    if (current) current.monsters += entry.count;
  }

  return counts;
};

/**
 * A scenario workspace for the encounter simulator: which PCs, which
 * monsters (with counts), and where each starts on the grid. No run/
 * playback logic lives here yet — that's milestones 4-6 — a scenario just
 * holds composition and placement at the end of milestone 3.
 */
export const simulatorRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const scenarios = await ctx.db
      .select()
      .from(simulatorScenarios)
      .where(isLiveScenario)
      .orderBy(asc(simulatorScenarios.name));

    const counts = await listScenarioCounts(
      ctx.db,
      scenarios.map(scenario => scenario.id),
    );

    return scenarios.map(scenario => ({
      ...scenario,
      partyCount: counts.get(scenario.id)?.party ?? 0,
      monsterCount: counts.get(scenario.id)?.monsters ?? 0,
    }));
  }),

  /**
   * Every party member/monster entry is resolved against its live source
   * row so a since-deleted PC/creature/custom-creature is dropped rather
   * than shown as a blank line — the same "dangling reference" handling
   * `presets.list` already uses.
   */
  get: publicProcedure
    .input(scenarioIdInputSchema)
    .query(async ({ ctx, input }) => {
      const scenario = await loadLiveScenario(ctx.db, input.id);

      const [members, entries] = await Promise.all([
        ctx.db
          .select()
          .from(simulatorScenarioPartyMembers)
          .where(
            and(
              eq(simulatorScenarioPartyMembers.scenarioId, scenario.id),
              isLiveMember,
            ),
          ),
        ctx.db
          .select()
          .from(simulatorScenarioMonsterEntries)
          .where(
            and(
              eq(simulatorScenarioMonsterEntries.scenarioId, scenario.id),
              isLiveEntry,
            ),
          )
          .orderBy(asc(simulatorScenarioMonsterEntries.sortOrder)),
      ]);

      const pcIds = members.map(member => member.playerCharacterId);
      const librarySlugs = entries
        .map(entry => entry.creatureSlug)
        .filter((slug): slug is string => slug !== null);
      const customCreatureIds = entries
        .map(entry => entry.customCreatureId)
        .filter((id): id is string => id !== null);

      const [pcRows, libraryRows, customRows] = await Promise.all([
        pcIds.length
          ? ctx.db
              .select({
                id: playerCharacters.id,
                name: playerCharacters.name,
                level: playerCharacters.level,
              })
              .from(playerCharacters)
              .where(and(inArray(playerCharacters.id, pcIds), isLivePc))
          : [],
        librarySlugs.length
          ? ctx.db
              .select({
                slug: creatures.slug,
                name: creatures.name,
                challengeRating: creatures.challengeRating,
              })
              .from(creatures)
              .where(inArray(creatures.slug, librarySlugs))
          : [],
        customCreatureIds.length
          ? ctx.db
              .select({
                id: customCreatures.id,
                name: customCreatures.name,
                challengeRating: customCreatures.challengeRating,
              })
              .from(customCreatures)
              .where(
                and(
                  inArray(customCreatures.id, customCreatureIds),
                  isLiveCustomCreature,
                ),
              )
          : [],
      ]);

      const pcById = new Map(pcRows.map(row => [row.id, row]));
      const libraryBySlug = new Map(libraryRows.map(row => [row.slug, row]));
      const customById = new Map(customRows.map(row => [row.id, row]));

      const party = members
        .map(member => {
          const pc = pcById.get(member.playerCharacterId);
          if (!pc) return null;

          return {
            id: member.id,
            playerCharacterId: member.playerCharacterId,
            name: pc.name,
            level: pc.level,
            position:
              member.positionX !== null && member.positionY !== null
                ? { x: member.positionX, y: member.positionY }
                : null,
          };
        })
        .filter(member => member !== null);

      const monsters = entries
        .map(entry => {
          const source =
            entry.creatureSlug !== null
              ? libraryBySlug.get(entry.creatureSlug)
              : entry.customCreatureId !== null
                ? customById.get(entry.customCreatureId)
                : undefined;

          if (!source) return null;

          return {
            id: entry.id,
            creatureSlug: entry.creatureSlug,
            customCreatureId: entry.customCreatureId,
            name: source.name,
            challengeRatingLabel: formatChallengeRating(source.challengeRating),
            count: entry.count,
            sortOrder: entry.sortOrder,
            position:
              entry.positionX !== null && entry.positionY !== null
                ? { x: entry.positionX, y: entry.positionY }
                : null,
          };
        })
        .filter(entry => entry !== null);

      return { scenario, party, monsters };
    }),

  create: publicProcedure
    .input(createScenarioInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(simulatorScenarios)
        .values({ name: input.name, note: input.note ?? null })
        .returning();

      return created;
    }),

  update: publicProcedure
    .input(updateScenarioInputSchema)
    .mutation(async ({ ctx, input }) => {
      const scenario = await loadLiveScenario(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(simulatorScenarios)
        .set({
          name: input.name,
          note: input.note ?? null,
          trialCount: input.trialCount,
          ...touchSyncMeta({ version: scenario.version, now: new Date() }),
        })
        .where(eq(simulatorScenarios.id, scenario.id))
        .returning();

      return updated;
    }),

  remove: publicProcedure
    .input(scenarioIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const scenario = await loadLiveScenario(ctx.db, input.id);

      await ctx.db
        .update(simulatorScenarios)
        .set(tombstoneSyncMeta({ version: scenario.version, now: new Date() }))
        .where(eq(simulatorScenarios.id, scenario.id));

      return { id: scenario.id };
    }),

  addPartyMember: publicProcedure
    .input(addPartyMemberInputSchema)
    .mutation(async ({ ctx, input }) => {
      const scenario = await loadLiveScenario(ctx.db, input.scenarioId);

      const pc = await ctx.db.query.playerCharacters.findFirst({
        where: and(eq(playerCharacters.id, input.playerCharacterId), isLivePc),
      });

      if (!pc) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That character no longer exists.',
        });
      }

      const existing = await ctx.db
        .select({ id: simulatorScenarioPartyMembers.id })
        .from(simulatorScenarioPartyMembers)
        .where(
          and(
            eq(simulatorScenarioPartyMembers.scenarioId, scenario.id),
            eq(
              simulatorScenarioPartyMembers.playerCharacterId,
              input.playerCharacterId,
            ),
            isLiveMember,
          ),
        );

      if (existing.length) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'That character is already in this scenario.',
        });
      }

      const [created] = await ctx.db
        .insert(simulatorScenarioPartyMembers)
        .values({
          scenarioId: scenario.id,
          playerCharacterId: input.playerCharacterId,
        })
        .returning();

      return created;
    }),

  removePartyMember: publicProcedure
    .input(idInputSchema)
    .mutation(async ({ ctx, input }) => {
      const member = await loadLivePartyMember(ctx.db, input.id);

      await ctx.db
        .update(simulatorScenarioPartyMembers)
        .set(tombstoneSyncMeta({ version: member.version, now: new Date() }))
        .where(eq(simulatorScenarioPartyMembers.id, member.id));

      return { id: member.id };
    }),

  setPartyMemberPosition: publicProcedure
    .input(setPartyMemberPositionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const member = await loadLivePartyMember(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(simulatorScenarioPartyMembers)
        .set({
          positionX: input.position?.x ?? null,
          positionY: input.position?.y ?? null,
          ...touchSyncMeta({ version: member.version, now: new Date() }),
        })
        .where(eq(simulatorScenarioPartyMembers.id, member.id))
        .returning();

      return updated;
    }),

  addMonsterEntry: publicProcedure
    .input(addMonsterEntryInputSchema)
    .mutation(async ({ ctx, input }) => {
      const scenario = await loadLiveScenario(ctx.db, input.scenarioId);

      if (input.creatureSlug !== undefined) {
        const source = await ctx.db.query.creatures.findFirst({
          where: eq(creatures.slug, input.creatureSlug),
        });

        if (!source) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'That creature no longer exists in the library.',
          });
        }
      } else if (input.customCreatureId !== undefined) {
        const source = await ctx.db.query.customCreatures.findFirst({
          where: and(
            eq(customCreatures.id, input.customCreatureId),
            isLiveCustomCreature,
          ),
        });

        if (!source) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'That custom creature no longer exists.',
          });
        }
      }

      const existingEntries = await ctx.db
        .select({ sortOrder: simulatorScenarioMonsterEntries.sortOrder })
        .from(simulatorScenarioMonsterEntries)
        .where(
          and(
            eq(simulatorScenarioMonsterEntries.scenarioId, scenario.id),
            isLiveEntry,
          ),
        );

      const nextSortOrder = existingEntries.reduce(
        (max, entry) => Math.max(max, entry.sortOrder + 1),
        0,
      );

      const [created] = await ctx.db
        .insert(simulatorScenarioMonsterEntries)
        .values({
          scenarioId: scenario.id,
          creatureSlug: input.creatureSlug ?? null,
          customCreatureId: input.customCreatureId ?? null,
          count: input.count,
          sortOrder: nextSortOrder,
        })
        .returning();

      return created;
    }),

  updateMonsterEntryCount: publicProcedure
    .input(updateMonsterEntryCountInputSchema)
    .mutation(async ({ ctx, input }) => {
      const entry = await loadLiveMonsterEntry(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(simulatorScenarioMonsterEntries)
        .set({
          count: input.count,
          ...touchSyncMeta({ version: entry.version, now: new Date() }),
        })
        .where(eq(simulatorScenarioMonsterEntries.id, entry.id))
        .returning();

      return updated;
    }),

  removeMonsterEntry: publicProcedure
    .input(idInputSchema)
    .mutation(async ({ ctx, input }) => {
      const entry = await loadLiveMonsterEntry(ctx.db, input.id);

      await ctx.db
        .update(simulatorScenarioMonsterEntries)
        .set(tombstoneSyncMeta({ version: entry.version, now: new Date() }))
        .where(eq(simulatorScenarioMonsterEntries.id, entry.id));

      return { id: entry.id };
    }),

  setMonsterEntryPosition: publicProcedure
    .input(setMonsterEntryPositionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const entry = await loadLiveMonsterEntry(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(simulatorScenarioMonsterEntries)
        .set({
          positionX: input.position?.x ?? null,
          positionY: input.position?.y ?? null,
          ...touchSyncMeta({ version: entry.version, now: new Date() }),
        })
        .where(eq(simulatorScenarioMonsterEntries.id, entry.id))
        .returning();

      return updated;
    }),

  /**
   * Headless Monte Carlo balance check (issue #5, milestone 6): runs the
   * scenario `trialCount` times with distinct, deterministic seeds derived
   * from one `baseSeed`, aggregates the results, and persists the summary
   * onto the scenario row so a DM can revisit it without re-running. Unlike
   * `runOnce` (an SSE route handler, since a single run is meant to be
   * watched as it happens) this returns once with the finished aggregate —
   * the issue's own "Proposed API" section treats these as two distinct
   * shapes, not two views of the same endpoint.
   *
   * Combatants are loaded once and reused across every trial — `runEncounter`
   * never mutates its input, only ever produces new combatant states
   * internally, so replaying the same starting roster with a different seed
   * per trial is safe and avoids up to `MAX_TRIAL_COUNT` redundant DB round
   * trips for data that never changes between trials.
   */
  runBatch: publicProcedure
    .input(runBatchInputSchema)
    .mutation(async ({ ctx, input }) => {
      const scenario = await loadLiveScenario(ctx.db, input.scenarioId);
      const trialCount = input.trialCount ?? scenario.trialCount;
      const baseSeed = input.seed ?? Math.floor(Math.random() * SEED_MODULUS);

      const combatants = await loadScenarioCombatants(ctx.db, scenario.id);

      const hasParty = combatants.some(c => c.side === 'party');
      const hasMonsters = combatants.some(c => c.side === 'monsters');
      if (!hasParty || !hasMonsters) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'This scenario needs at least one party member and one monster before it can run.',
        });
      }

      const results: EngineResult[] = Array.from(
        { length: trialCount },
        (_, index) =>
          runEncounter({ combatants }, (baseSeed + index) % SEED_MODULUS),
      );

      const summary = aggregateBatchResults(baseSeed, results);
      const now = new Date();

      const [updated] = await ctx.db
        .update(simulatorScenarios)
        .set({
          lastRunAt: now,
          lastRunSummary: summary,
          ...touchSyncMeta({ version: scenario.version, now }),
        })
        .where(eq(simulatorScenarios.id, scenario.id))
        .returning();

      return updated;
    }),
});
