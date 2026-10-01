import { and, asc, desc, eq, inArray, isNull, max } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import {
  bastionBasicFacilities,
  bastionProjects,
  bastionSpecialFacilities,
  bastionStorageItems,
  bastionTurns,
  bastions,
  playerCharacters,
} from '~/server/db/schema';
import type { Database } from '~/server/db';
import {
  saveTurnDraftInputSchema,
  turnDraftSchema,
  turnIdInputSchema,
} from '~/server/trpc/schemas/bastionTurns';
import {
  planTurnCommit,
  startTurnDraft,
  toTurnContext,
} from '~/server/trpc/helpers/bastionTurnPlan';
import { describeProject } from '~/server/trpc/helpers/toBastionDetail';
import {
  tombstoneSyncMeta,
  touchSyncMeta,
} from '~/server/trpc/helpers/touchSyncMeta';
import { findSpecialFacility } from '~/content/bastion/specialFacilities';
import { basicTypeLabel } from '~/utils/bastionRules';
import { ensureParty } from '~/server/party/state';
import { refundToTreasury, spendFromTreasury } from '~/server/party/treasury';
import { completeProject } from '~/server/bastions/rows';

const liveDraft = (db: Database) =>
  db.query.bastionTurns.findFirst({
    where: and(
      eq(bastionTurns.status, 'draft'),
      isNull(bastionTurns.deletedAt),
    ),
  });

const nextTurnNumber = async (db: Database) => {
  const [row] = await db
    .select({ highest: max(bastionTurns.number) })
    .from(bastionTurns)
    .where(
      and(eq(bastionTurns.status, 'committed'), isNull(bastionTurns.deletedAt)),
    );

  return (row?.highest ?? 0) + 1;
};

/** Everything the wizard and the commit need, read in one place. */
const loadTurnContext = async (db: Database, turnNumber: number) => {
  const party = await ensureParty(db);
  const liveBastions = await db
    .select()
    .from(bastions)
    .where(isNull(bastions.deletedAt))
    .orderBy(asc(bastions.name));
  const bastionIds = liveBastions.map(({ id }) => id);
  const ofLiveBastions = <T extends { bastionId: unknown; deletedAt: unknown }>(
    table: T,
  ) =>
    and(
      inArray(table.bastionId as never, bastionIds),
      isNull(table.deletedAt as never),
    );

  const [special, basic, projects, characters] = bastionIds.length
    ? await Promise.all([
        db
          .select()
          .from(bastionSpecialFacilities)
          .where(ofLiveBastions(bastionSpecialFacilities))
          .orderBy(asc(bastionSpecialFacilities.createdAt)),
        db
          .select()
          .from(bastionBasicFacilities)
          .where(ofLiveBastions(bastionBasicFacilities)),
        db
          .select()
          .from(bastionProjects)
          .where(
            and(
              ofLiveBastions(bastionProjects),
              isNull(bastionProjects.completedAt),
            ),
          )
          .orderBy(asc(bastionProjects.createdAt)),
        db
          .select()
          .from(playerCharacters)
          .where(isNull(playerCharacters.deletedAt))
          .orderBy(asc(playerCharacters.name)),
      ])
    : [[], [], [], []];

  const facilityNames = new Map([
    ...special.map(
      row =>
        [
          row.id,
          findSpecialFacility(row.facilityKey)?.name ?? row.facilityKey,
        ] as const,
    ),
    ...basic.map(row => [row.id, basicTypeLabel(row.type)] as const),
  ]);

  return toTurnContext({
    turnNumber,
    treasuryGold: party.treasuryGold,
    bastions: liveBastions,
    facilities: special,
    projects: projects.map(project => ({
      id: project.id,
      bastionId: project.bastionId,
      description: describeProject(project, facilityNames),
      daysRemaining: project.daysRemaining,
    })),
    characters,
  });
};

export const bastionTurnsRouter = createTRPCRouter({
  /**
   * The turn in progress, if any, with the context to show it in — or, when
   * none is under way, the context a new one would start from.
   */
  current: publicProcedure.query(async ({ ctx }) => {
    const draft = await liveDraft(ctx.db);
    const turnNumber = draft?.number ?? (await nextTurnNumber(ctx.db));
    const context = await loadTurnContext(ctx.db, turnNumber);

    return {
      turn: draft
        ? {
            id: draft.id,
            number: draft.number,
            draft: turnDraftSchema.parse(draft.draft),
          }
        : null,
      context,
    };
  }),

  /** Starts a turn — or hands back the one already under way. */
  start: publicProcedure.mutation(async ({ ctx }) => {
    const existing = await liveDraft(ctx.db);
    if (existing) return { id: existing.id };

    const number = await nextTurnNumber(ctx.db);
    const context = await loadTurnContext(ctx.db, number);
    if (!context.bastions.length) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'There is no bastion to take a turn for.',
      });
    }

    const [created] = await ctx.db
      .insert(bastionTurns)
      .values({ number, status: 'draft', draft: startTurnDraft(context) })
      .returning();

    return { id: created!.id };
  }),

  /** Saves the wizard's progress after each step. */
  saveDraft: publicProcedure
    .input(saveTurnDraftInputSchema)
    .mutation(async ({ ctx, input }) => {
      const turn = await liveDraft(ctx.db);
      if (!turn || turn.id !== input.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That turn is no longer in progress.',
        });
      }

      await ctx.db
        .update(bastionTurns)
        .set({
          draft: input.draft,
          ...touchSyncMeta({ version: turn.version, now: new Date() }),
        })
        .where(eq(bastionTurns.id, turn.id));

      return { id: turn.id };
    }),

  /**
   * What committing this draft would do, without doing it — the review step.
   * The same `planTurnCommit` the commit runs, so the preview cannot drift.
   */
  preview: publicProcedure
    .input(saveTurnDraftInputSchema)
    .mutation(async ({ ctx, input }) => {
      const turn = await liveDraft(ctx.db);
      if (!turn || turn.id !== input.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That turn is no longer in progress.',
        });
      }

      const context = await loadTurnContext(ctx.db, turn.number);
      const result = planTurnCommit(input.draft, context);

      return result.ok
        ? {
            ok: true as const,
            lines: result.plan.lines,
            treasuryDelta: result.plan.treasuryDelta,
            storedItems: result.plan.storageItems.map(item => item.name),
            defenders: result.plan.bastions.map(bastion => ({
              id: bastion.id,
              defenderCount: bastion.defenderCount,
            })),
          }
        : { ok: false as const, problems: result.problems };
    }),

  /** Throws the turn in progress away; nothing it chose has happened yet. */
  discard: publicProcedure
    .input(turnIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const turn = await liveDraft(ctx.db);
      if (!turn || turn.id !== input.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That turn is no longer in progress.',
        });
      }

      await ctx.db
        .update(bastionTurns)
        .set(tombstoneSyncMeta({ version: turn.version, now: new Date() }))
        .where(eq(bastionTurns.id, turn.id));

      return { id: turn.id };
    }),

  /**
   * Applies the turn: seven days pass, finished work delivers, new orders
   * start and are paid for, every Bastion Event lands. Refused, with nothing
   * changed, when `planTurnCommit` finds a problem.
   */
  commit: publicProcedure
    .input(turnIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const turn = await liveDraft(ctx.db);
      if (!turn || turn.id !== input.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That turn is no longer in progress.',
        });
      }

      const draft = turnDraftSchema.parse(turn.draft);
      const context = await loadTurnContext(ctx.db, turn.number);
      const result = planTurnCommit(draft, context);
      if (!result.ok) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.problems.join(' '),
        });
      }
      const { plan } = result;
      const now = new Date();

      // Gold first: the one step that can still fail, so it fails before
      // anything else has changed.
      if (plan.treasuryDelta < 0) {
        const balance = await spendFromTreasury(ctx.db, -plan.treasuryDelta);
        if (balance === null) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'The treasury does not hold enough gold for this turn.',
          });
        }
      } else if (plan.treasuryDelta > 0) {
        await refundToTreasury(ctx.db, plan.treasuryDelta);
      }

      for (const bastion of plan.bastions) {
        await ctx.db
          .update(bastions)
          .set({
            defenderCount: bastion.defenderCount,
            isArmoryStocked: bastion.isArmoryStocked,
            hasGuestMonster: bastion.hasGuestMonster,
            updatedAt: now,
          })
          .where(eq(bastions.id, bastion.id));
      }

      for (const facility of plan.facilities) {
        await ctx.db
          .update(bastionSpecialFacilities)
          .set({
            jobOptionKey: facility.jobOptionKey,
            jobNote: facility.jobNote,
            jobDaysRemaining: facility.jobDaysRemaining,
            outOfActionTurns: facility.outOfActionTurns,
            updatedAt: now,
          })
          .where(eq(bastionSpecialFacilities.id, facility.id));
      }

      for (const project of plan.projectsToAdvance) {
        await ctx.db
          .update(bastionProjects)
          .set({ daysRemaining: project.daysRemaining, updatedAt: now })
          .where(eq(bastionProjects.id, project.id));
      }
      if (plan.projectsToComplete.length) {
        const finishing = await ctx.db
          .select()
          .from(bastionProjects)
          .where(inArray(bastionProjects.id, plan.projectsToComplete));
        for (const project of finishing) {
          await completeProject(ctx.db, project);
        }
      }

      if (plan.storageItems.length) {
        await ctx.db.insert(bastionStorageItems).values(plan.storageItems);
      }

      await ctx.db
        .update(bastionTurns)
        .set({
          status: 'committed',
          summary: { lines: plan.lines, treasuryDelta: plan.treasuryDelta },
          committedAt: now,
          ...touchSyncMeta({ version: turn.version, now }),
        })
        .where(eq(bastionTurns.id, turn.id));

      return { id: turn.id, number: turn.number, lines: plan.lines };
    }),

  /** Committed turns, newest first. */
  history: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(bastionTurns)
      .where(
        and(
          eq(bastionTurns.status, 'committed'),
          isNull(bastionTurns.deletedAt),
        ),
      )
      .orderBy(desc(bastionTurns.number));

    return rows.map(row => {
      const summary = (row.summary ?? {}) as {
        lines?: string[];
        treasuryDelta?: number;
      };

      return {
        id: row.id,
        number: row.number,
        committedAt: row.committedAt,
        lines: summary.lines ?? [],
        treasuryDelta: summary.treasuryDelta ?? 0,
      };
    });
  }),
});
