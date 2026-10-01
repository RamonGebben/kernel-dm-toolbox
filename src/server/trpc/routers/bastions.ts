import { and, asc, eq, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import {
  bastionBasicFacilities,
  bastionProjects,
  bastionSpecialFacilities,
  bastionStorageItems,
  bastions,
  playerCharacters,
} from '~/server/db/schema';
import type { Database } from '~/server/db';
import {
  addBasicFacilityInputSchema,
  addSpecialFacilityInputSchema,
  addStorageItemInputSchema,
  bastionIdInputSchema,
  bastionRowIdInputSchema,
  claimStorageItemInputSchema,
  foundBastionInputSchema,
  setFacilityVariantInputSchema,
  startProjectInputSchema,
  updateBastionInputSchema,
  type StartProjectInput,
} from '~/server/trpc/schemas/bastions';
import {
  tombstoneSyncMeta,
  touchSyncMeta,
} from '~/server/trpc/helpers/touchSyncMeta';
import {
  planBastionProject,
  toProjectCompletion,
  type ProjectRequest,
} from '~/server/trpc/helpers/planBastionProject';
import { toBastionDetail } from '~/server/trpc/helpers/toBastionDetail';
import { findSpecialFacility } from '~/content/bastion/specialFacilities';
import {
  allowanceForLevel,
  describeEligibilityProblem,
  findEligibilityProblems,
} from '~/utils/bastionRules';
import { refundToTreasury, spendFromTreasury } from '~/server/party/treasury';

const notFound = (what: string) =>
  new TRPCError({
    code: 'NOT_FOUND',
    message: `That ${what} no longer exists.`,
  });

const loadBastion = async (db: Database, id: string) => {
  const bastion = await db.query.bastions.findFirst({
    where: and(eq(bastions.id, id), isNull(bastions.deletedAt)),
  });
  if (!bastion) throw notFound('bastion');

  return bastion;
};

const loadOwner = async (db: Database, id: string) => {
  const owner = await db.query.playerCharacters.findFirst({
    where: and(eq(playerCharacters.id, id), isNull(playerCharacters.deletedAt)),
  });
  if (!owner) throw notFound('character');

  return owner;
};

const liveSpecialFacilities = (db: Database, bastionId: string) =>
  db
    .select()
    .from(bastionSpecialFacilities)
    .where(
      and(
        eq(bastionSpecialFacilities.bastionId, bastionId),
        isNull(bastionSpecialFacilities.deletedAt),
      ),
    )
    .orderBy(asc(bastionSpecialFacilities.createdAt));

const loadSpecialFacility = async (db: Database, id: string) => {
  const facility = await db.query.bastionSpecialFacilities.findFirst({
    where: and(
      eq(bastionSpecialFacilities.id, id),
      isNull(bastionSpecialFacilities.deletedAt),
    ),
  });
  if (!facility) throw notFound('facility');

  return facility;
};

const loadBasicFacility = async (db: Database, id: string) => {
  const facility = await db.query.bastionBasicFacilities.findFirst({
    where: and(
      eq(bastionBasicFacilities.id, id),
      isNull(bastionBasicFacilities.deletedAt),
    ),
  });
  if (!facility) throw notFound('facility');

  return facility;
};

const openProjectFor = (db: Database, facilityId: string) =>
  db.query.bastionProjects.findFirst({
    where: and(
      eq(bastionProjects.facilityId, facilityId),
      isNull(bastionProjects.completedAt),
      isNull(bastionProjects.deletedAt),
    ),
  });

const loadOpenProject = async (db: Database, id: string) => {
  const project = await db.query.bastionProjects.findFirst({
    where: and(
      eq(bastionProjects.id, id),
      isNull(bastionProjects.completedAt),
      isNull(bastionProjects.deletedAt),
    ),
  });
  if (!project) throw notFound('project');

  return project;
};

/** Turns the wire request into what `planBastionProject` needs, reading the target facility. */
const resolveProjectRequest = async (
  db: Database,
  bastionId: string,
  request: StartProjectInput['request'],
): Promise<ProjectRequest> => {
  if (request.kind === 'add-basic' || request.kind === 'walls') return request;

  const assertEnlargeable = async (facility: {
    id: string;
    bastionId: string;
  }) => {
    if (facility.bastionId !== bastionId) throw notFound('facility');
    if (await openProjectFor(db, facility.id)) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'That facility is already being enlarged.',
      });
    }
  };

  if (request.kind === 'enlarge-basic') {
    const facility = await loadBasicFacility(db, request.facilityId);
    await assertEnlargeable(facility);

    return { kind: 'enlarge-basic', facility };
  }

  const facility = await loadSpecialFacility(db, request.facilityId);
  await assertEnlargeable(facility);

  return { kind: 'enlarge-special', facility };
};

/** Applies a finished project's effect and stamps it complete. */
const completeProject = async (
  db: Database,
  project: typeof bastionProjects.$inferSelect,
) => {
  const now = new Date();
  const completion = toProjectCompletion(project);

  if (completion.type === 'insert-basic') {
    await db.insert(bastionBasicFacilities).values({
      bastionId: project.bastionId,
      type: completion.basicType,
      space: completion.space,
    });
  }

  if (completion.type === 'resize-basic') {
    const facility = await loadBasicFacility(db, completion.facilityId);
    await db
      .update(bastionBasicFacilities)
      .set({
        space: completion.space,
        ...touchSyncMeta({ version: facility.version, now }),
      })
      .where(eq(bastionBasicFacilities.id, facility.id));
  }

  if (completion.type === 'resize-special') {
    const facility = await loadSpecialFacility(db, completion.facilityId);
    await db
      .update(bastionSpecialFacilities)
      .set({
        space: completion.space,
        ...touchSyncMeta({ version: facility.version, now }),
      })
      .where(eq(bastionSpecialFacilities.id, facility.id));
  }

  if (completion.type === 'add-walls') {
    const bastion = await loadBastion(db, project.bastionId);
    await db
      .update(bastions)
      .set({
        wallSquares: bastion.wallSquares + completion.squares,
        ...touchSyncMeta({ version: bastion.version, now }),
      })
      .where(eq(bastions.id, bastion.id));
  }

  await db
    .update(bastionProjects)
    .set({
      daysRemaining: 0,
      completedAt: now,
      ...touchSyncMeta({ version: project.version, now }),
    })
    .where(eq(bastionProjects.id, project.id));
};

export const bastionsRouter = createTRPCRouter({
  /** Every live bastion with its owner, for the list beside the detail. */
  list: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: bastions.id,
        name: bastions.name,
        ownerId: playerCharacters.id,
        ownerName: playerCharacters.name,
        ownerLevel: playerCharacters.level,
      })
      .from(bastions)
      .innerJoin(
        playerCharacters,
        eq(bastions.ownerCharacterId, playerCharacters.id),
      )
      .where(isNull(bastions.deletedAt))
      .orderBy(asc(bastions.name));

    const facilities = await ctx.db
      .select({ bastionId: bastionSpecialFacilities.bastionId })
      .from(bastionSpecialFacilities)
      .where(isNull(bastionSpecialFacilities.deletedAt));

    return rows.map(row => ({
      ...row,
      specialFacilityCount: facilities.filter(
        facility => facility.bastionId === row.id,
      ).length,
      allowance: allowanceForLevel(row.ownerLevel),
    }));
  }),

  get: publicProcedure
    .input(bastionIdInputSchema)
    .query(async ({ ctx, input }) => {
      const bastion = await loadBastion(ctx.db, input.id);
      const owner = await ctx.db.query.playerCharacters.findFirst({
        where: eq(playerCharacters.id, bastion.ownerCharacterId),
      });
      if (!owner) throw notFound('character');

      const [
        specialFacilities,
        basicFacilities,
        openProjects,
        storageItems,
        characters,
      ] = await Promise.all([
        liveSpecialFacilities(ctx.db, bastion.id),
        ctx.db
          .select()
          .from(bastionBasicFacilities)
          .where(
            and(
              eq(bastionBasicFacilities.bastionId, bastion.id),
              isNull(bastionBasicFacilities.deletedAt),
            ),
          )
          .orderBy(asc(bastionBasicFacilities.createdAt)),
        ctx.db
          .select()
          .from(bastionProjects)
          .where(
            and(
              eq(bastionProjects.bastionId, bastion.id),
              isNull(bastionProjects.completedAt),
              isNull(bastionProjects.deletedAt),
            ),
          )
          .orderBy(asc(bastionProjects.createdAt)),
        ctx.db
          .select()
          .from(bastionStorageItems)
          .where(
            and(
              eq(bastionStorageItems.bastionId, bastion.id),
              isNull(bastionStorageItems.deletedAt),
            ),
          )
          .orderBy(asc(bastionStorageItems.createdAt)),
        ctx.db
          .select({ id: playerCharacters.id, name: playerCharacters.name })
          .from(playerCharacters),
      ]);

      return toBastionDetail({
        bastion,
        owner: {
          id: owner.id,
          name: owner.name,
          level: owner.level,
          className: owner.className,
        },
        specialFacilities,
        basicFacilities,
        openProjects,
        storageItems,
        characterNames: new Map(characters.map(({ id, name }) => [id, name])),
      });
    }),

  /** A new bastion with its two free basic facilities. */
  found: publicProcedure
    .input(foundBastionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const owner = await loadOwner(ctx.db, input.ownerCharacterId);

      const existing = await ctx.db.query.bastions.findFirst({
        where: and(
          eq(bastions.ownerCharacterId, owner.id),
          isNull(bastions.deletedAt),
        ),
      });
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `${owner.name} already has a bastion.`,
        });
      }

      const [created] = await ctx.db
        .insert(bastions)
        .values({ ownerCharacterId: owner.id, name: input.name })
        .returning();

      await ctx.db.insert(bastionBasicFacilities).values([
        {
          bastionId: created!.id,
          type: input.crampedBasicType,
          space: 'cramped',
        },
        { bastionId: created!.id, type: input.roomyBasicType, space: 'roomy' },
      ]);

      return created!;
    }),

  update: publicProcedure
    .input(updateBastionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const bastion = await loadBastion(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(bastions)
        .set({
          name: input.name,
          notes: input.notes || null,
          defenderCount: input.defenderCount,
          wallSquares: input.wallSquares,
          isFullyEnclosed: input.isFullyEnclosed,
          ...touchSyncMeta({ version: bastion.version, now: new Date() }),
        })
        .where(eq(bastions.id, bastion.id))
        .returning();

      return updated!;
    }),

  /**
   * Divestiture: the bastion is given up. Soft-deleted like everything else;
   * the owner is then free to found a new one.
   */
  abandon: publicProcedure
    .input(bastionIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const bastion = await loadBastion(ctx.db, input.id);

      await ctx.db
        .update(bastions)
        .set(tombstoneSyncMeta({ version: bastion.version, now: new Date() }))
        .where(eq(bastions.id, bastion.id));

      return { id: bastion.id };
    }),

  addSpecialFacility: publicProcedure
    .input(addSpecialFacilityInputSchema)
    .mutation(async ({ ctx, input }) => {
      const bastion = await loadBastion(ctx.db, input.bastionId);
      const facility = findSpecialFacility(input.facilityKey);
      if (!facility) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'There is no such special facility.',
        });
      }

      if (!input.ignoreRequirements) {
        const owner = await loadOwner(ctx.db, bastion.ownerCharacterId);
        const held = await liveSpecialFacilities(ctx.db, bastion.id);
        const problems = findEligibilityProblems(
          facility,
          owner,
          held.map(row => row.facilityKey),
        );

        if (problems.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: problems.map(describeEligibilityProblem).join('; '),
          });
        }
      }

      const variant =
        input.variant && facility.variant?.options.includes(input.variant)
          ? input.variant
          : null;

      const [created] = await ctx.db
        .insert(bastionSpecialFacilities)
        .values({
          bastionId: bastion.id,
          facilityKey: facility.key,
          space: facility.space,
          variant,
        })
        .returning();

      return created!;
    }),

  setFacilityVariant: publicProcedure
    .input(setFacilityVariantInputSchema)
    .mutation(async ({ ctx, input }) => {
      const facility = await loadSpecialFacility(ctx.db, input.id);
      const options = findSpecialFacility(facility.facilityKey)?.variant
        ?.options;

      if (input.variant !== null && !options?.includes(input.variant)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'That is not an option for this facility.',
        });
      }

      const [updated] = await ctx.db
        .update(bastionSpecialFacilities)
        .set({
          variant: input.variant,
          ...touchSyncMeta({ version: facility.version, now: new Date() }),
        })
        .where(eq(bastionSpecialFacilities.id, facility.id))
        .returning();

      return updated!;
    }),

  /** Removing a special facility — what a level-up swap starts with. */
  removeSpecialFacility: publicProcedure
    .input(bastionRowIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const facility = await loadSpecialFacility(ctx.db, input.id);
      const now = new Date();

      await ctx.db
        .update(bastionSpecialFacilities)
        .set(tombstoneSyncMeta({ version: facility.version, now }))
        .where(eq(bastionSpecialFacilities.id, facility.id));

      // An enlargement under way has nothing left to enlarge: refund it.
      const project = await openProjectFor(ctx.db, facility.id);
      if (project) {
        await ctx.db
          .update(bastionProjects)
          .set(tombstoneSyncMeta({ version: project.version, now }))
          .where(eq(bastionProjects.id, project.id));
        await refundToTreasury(ctx.db, project.costGp);
      }

      return { id: facility.id };
    }),

  addBasicFacility: publicProcedure
    .input(addBasicFacilityInputSchema)
    .mutation(async ({ ctx, input }) => {
      const bastion = await loadBastion(ctx.db, input.bastionId);

      const [created] = await ctx.db
        .insert(bastionBasicFacilities)
        .values({ bastionId: bastion.id, type: input.type, space: input.space })
        .returning();

      return created!;
    }),

  removeBasicFacility: publicProcedure
    .input(bastionRowIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const facility = await loadBasicFacility(ctx.db, input.id);
      const now = new Date();

      await ctx.db
        .update(bastionBasicFacilities)
        .set(tombstoneSyncMeta({ version: facility.version, now }))
        .where(eq(bastionBasicFacilities.id, facility.id));

      const project = await openProjectFor(ctx.db, facility.id);
      if (project) {
        await ctx.db
          .update(bastionProjects)
          .set(tombstoneSyncMeta({ version: project.version, now }))
          .where(eq(bastionProjects.id, project.id));
        await refundToTreasury(ctx.db, project.costGp);
      }

      return { id: facility.id };
    }),

  /**
   * Starts construction, paid up front from the party treasury. Refused —
   * with nothing spent — when the treasury cannot cover it.
   */
  startProject: publicProcedure
    .input(startProjectInputSchema)
    .mutation(async ({ ctx, input }) => {
      const bastion = await loadBastion(ctx.db, input.bastionId);
      const request = await resolveProjectRequest(
        ctx.db,
        bastion.id,
        input.request,
      );

      const result = planBastionProject(request);
      if (!result.ok) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            result.reason === 'already-vast'
              ? 'That facility is already Vast.'
              : 'That facility cannot be enlarged.',
        });
      }

      const balance = await spendFromTreasury(ctx.db, result.plan.costGp);
      if (balance === null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'The treasury does not hold enough gold for that.',
        });
      }

      try {
        const [created] = await ctx.db
          .insert(bastionProjects)
          .values({ bastionId: bastion.id, ...result.plan })
          .returning();

        return created!;
      } catch (error) {
        await refundToTreasury(ctx.db, result.plan.costGp);
        throw error;
      }
    }),

  /** The DM's shortcut: finish now rather than waiting out the days. */
  finishProject: publicProcedure
    .input(bastionRowIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await loadOpenProject(ctx.db, input.id);
      await completeProject(ctx.db, project);

      return { id: project.id };
    }),

  /** Cancels construction and gives the gold back to the treasury. */
  cancelProject: publicProcedure
    .input(bastionRowIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await loadOpenProject(ctx.db, input.id);

      await ctx.db
        .update(bastionProjects)
        .set(tombstoneSyncMeta({ version: project.version, now: new Date() }))
        .where(eq(bastionProjects.id, project.id));
      await refundToTreasury(ctx.db, project.costGp);

      return { id: project.id };
    }),

  addStorageItem: publicProcedure
    .input(addStorageItemInputSchema)
    .mutation(async ({ ctx, input }) => {
      const bastion = await loadBastion(ctx.db, input.bastionId);

      const [created] = await ctx.db
        .insert(bastionStorageItems)
        .values({
          bastionId: bastion.id,
          name: input.name,
          quantity: input.quantity,
          note: input.note || null,
        })
        .returning();

      return created!;
    }),

  claimStorageItem: publicProcedure
    .input(claimStorageItemInputSchema)
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.query.bastionStorageItems.findFirst({
        where: and(
          eq(bastionStorageItems.id, input.id),
          isNull(bastionStorageItems.deletedAt),
        ),
      });
      if (!item) throw notFound('item');
      if (input.characterId) await loadOwner(ctx.db, input.characterId);

      const now = new Date();
      const [updated] = await ctx.db
        .update(bastionStorageItems)
        .set({
          claimedByCharacterId: input.characterId,
          claimedAt: input.characterId ? now : null,
          ...touchSyncMeta({ version: item.version, now }),
        })
        .where(eq(bastionStorageItems.id, item.id))
        .returning();

      return updated!;
    }),

  removeStorageItem: publicProcedure
    .input(bastionRowIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.query.bastionStorageItems.findFirst({
        where: and(
          eq(bastionStorageItems.id, input.id),
          isNull(bastionStorageItems.deletedAt),
        ),
      });
      if (!item) throw notFound('item');

      await ctx.db
        .update(bastionStorageItems)
        .set(tombstoneSyncMeta({ version: item.version, now: new Date() }))
        .where(eq(bastionStorageItems.id, item.id));

      return { id: item.id };
    }),
});
