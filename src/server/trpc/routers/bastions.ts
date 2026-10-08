import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import {
  bastionBasicFacilities,
  bastionProjects,
  bastionSpecialFacilities,
  bastionStorageItems,
  bastions,
  CURRENT_PARTY_ID,
  parties,
  playerCharacters,
  type BastionMode,
  type PlayerCharacter,
} from '~/server/db/schema';
import type { Database } from '~/server/db';
import {
  addBasicFacilityInputSchema,
  addFreeRoomsInputSchema,
  addSpecialFacilityInputSchema,
  addStorageItemInputSchema,
  bastionIdInputSchema,
  bastionRowIdInputSchema,
  claimStorageItemInputSchema,
  foundBastionInputSchema,
  setBastionModeInputSchema,
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
  type ProjectRequest,
} from '~/server/trpc/helpers/planBastionProject';
import { toBastionDetail } from '~/server/trpc/helpers/toBastionDetail';
import {
  planBastionMerge,
  planBastionSplit,
} from '~/server/trpc/helpers/planBastionModeChange';
import { ensureParty } from '~/server/party/state';
import {
  abandonBastion,
  cancelProject,
  completeProject,
  loadBasicFacility,
  loadBastion,
  loadLiveCharacter,
  loadSpecialFacility,
  loadStorageItem,
  notFound,
} from '~/server/bastions/rows';
import { findTopHolder } from '~/utils/bastionSelection';
import { findSpecialFacility } from '~/content/bastion/specialFacilities';
import type { BasicFacilityType } from '~/content/bastion/types';
import {
  allowanceForLevel,
  describeEligibilityProblem,
  findEligibilityProblems,
} from '~/utils/bastionRules';
import { refundToTreasury, spendFromTreasury } from '~/server/party/treasury';

const liveCharacters = (db: Database) =>
  db
    .select()
    .from(playerCharacters)
    .where(isNull(playerCharacters.deletedAt))
    .orderBy(asc(playerCharacters.name));

const liveBastions = (db: Database) =>
  db
    .select()
    .from(bastions)
    .where(isNull(bastions.deletedAt))
    .orderBy(asc(bastions.createdAt));

const currentMode = async (db: Database): Promise<BastionMode> =>
  (await ensureParty(db)).bastionMode;

/**
 * Who may hold facilities in a party bastion: every active member, plus
 * anyone benched who still holds one — their facilities do not vanish.
 */
const partyMembers = (
  characters: ReadonlyArray<PlayerCharacter>,
  holderIds: ReadonlySet<string>,
) =>
  characters
    .filter(character => character.isActive || holderIds.has(character.id))
    .sort((a, b) => a.name.localeCompare(b.name));

const toMember = (character: PlayerCharacter) => ({
  id: character.id,
  name: character.name,
  level: character.level,
  className: character.className,
  isActive: character.isActive,
});

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

const freeRooms = (
  bastionId: string,
  characterId: string,
  rooms: {
    crampedBasicType: BasicFacilityType;
    roomyBasicType: BasicFacilityType;
  },
) => [
  {
    bastionId,
    contributedByCharacterId: characterId,
    type: rooms.crampedBasicType,
    space: 'cramped' as const,
  },
  {
    bastionId,
    contributedByCharacterId: characterId,
    type: rooms.roomyBasicType,
    space: 'roomy' as const,
  },
];

/** Every row of a bastion's own tables, re-pointed in one go. */
const childTables = [
  bastionSpecialFacilities,
  bastionBasicFacilities,
  bastionProjects,
  bastionStorageItems,
] as const;

/** Per-character → party: one bastion, everything moved into it. */
const mergeBastions = async (
  db: Database,
  existing: ReadonlyArray<typeof bastions.$inferSelect>,
  name: string,
  now: Date,
) => {
  if (!existing.length) return;

  const [merged] = await db
    .insert(bastions)
    .values({ ownerCharacterId: null, ...planBastionMerge(existing, name) })
    .returning();
  const ids = existing.map(bastion => bastion.id);

  for (const table of childTables) {
    await db
      .update(table)
      .set({ bastionId: merged!.id, updatedAt: now })
      .where(inArray(table.bastionId, ids));
  }

  for (const bastion of existing) {
    await db
      .update(bastions)
      .set(tombstoneSyncMeta({ version: bastion.version, now }))
      .where(eq(bastions.id, bastion.id));
  }
};

/** Party → per-character: one bastion per holder, the keeper taking the rest. */
const splitBastion = async (
  db: Database,
  shared: typeof bastions.$inferSelect,
  keeperId: string,
  now: Date,
) => {
  const inShared = <T extends (typeof childTables)[number]>(table: T) =>
    db
      .select()
      .from(table)
      .where(and(eq(table.bastionId, shared.id), isNull(table.deletedAt)));

  const [special, basic, projects, storage] = await Promise.all([
    inShared(bastionSpecialFacilities),
    inShared(bastionBasicFacilities),
    inShared(bastionProjects),
    inShared(bastionStorageItems),
  ]);

  const characters = await liveCharacters(db);
  const split = planBastionSplit({
    keeperId,
    liveCharacterIds: new Set(characters.map(({ id }) => id)),
    isArmoryStocked: shared.isArmoryStocked,
    specialFacilities: special as Array<
      typeof bastionSpecialFacilities.$inferSelect
    >,
    basicFacilities: basic as Array<typeof bastionBasicFacilities.$inferSelect>,
    projects: projects as Array<typeof bastionProjects.$inferSelect>,
    storageItems: storage,
  });

  const nameOf = (id: string) =>
    characters.find(character => character.id === id)?.name ?? 'Unknown';

  const bastionFor = new Map<string, string>();
  for (const ownerId of split.ownerIds) {
    const isKeeper = ownerId === keeperId;
    const [created] = await db
      .insert(bastions)
      .values({
        ownerCharacterId: ownerId,
        name: isKeeper ? shared.name : `${nameOf(ownerId)}'s Bastion`,
        notes: isKeeper ? shared.notes : null,
        defenderCount: isKeeper ? shared.defenderCount : 0,
        wallSquares: isKeeper ? shared.wallSquares : 0,
        isFullyEnclosed: isKeeper ? shared.isFullyEnclosed : false,
        isArmoryStocked: ownerId === split.stockedArmoryOwnerId,
        hasGuestMonster: isKeeper ? shared.hasGuestMonster : false,
      })
      .returning();
    bastionFor.set(ownerId, created!.id);
  }

  const moves = [
    [bastionSpecialFacilities, split.specialFacilities],
    [bastionBasicFacilities, split.basicFacilities],
    [bastionProjects, split.projects],
    [bastionStorageItems, split.storageItems],
  ] as const;

  for (const [table, assignment] of moves) {
    for (const [ownerId, bastionId] of bastionFor) {
      const rowIds = [...assignment]
        .filter(([, assignedTo]) => assignedTo === ownerId)
        .map(([rowId]) => rowId);
      if (!rowIds.length) continue;

      await db
        .update(table)
        .set({ bastionId, updatedAt: now })
        .where(inArray(table.id, rowIds));
    }
  }

  // A facility held by nobody (a DM override) or by a removed character now
  // belongs to the keeper.
  const keepersOwn = [...split.specialFacilities]
    .filter(([, ownerId]) => ownerId === keeperId)
    .map(([rowId]) => rowId);
  if (keepersOwn.length) {
    await db
      .update(bastionSpecialFacilities)
      .set({ holderCharacterId: keeperId })
      .where(inArray(bastionSpecialFacilities.id, keepersOwn));
  }

  await db
    .update(bastions)
    .set(tombstoneSyncMeta({ version: shared.version, now }))
    .where(eq(bastions.id, shared.id));
};

export const bastionsRouter = createTRPCRouter({
  /** Every live bastion with its owner, for the list beside the detail. */
  list: publicProcedure.query(async ({ ctx }) => {
    const [rows, characters, facilities] = await Promise.all([
      liveBastions(ctx.db),
      liveCharacters(ctx.db),
      ctx.db
        .select({
          bastionId: bastionSpecialFacilities.bastionId,
          holderCharacterId: bastionSpecialFacilities.holderCharacterId,
        })
        .from(bastionSpecialFacilities)
        .where(isNull(bastionSpecialFacilities.deletedAt)),
    ]);
    const byId = new Map(
      characters.map(character => [character.id, character]),
    );

    return (
      rows
        // A character bastion whose owner was removed is not anyone's any more;
        // `characters.remove` gives it up, this only hides one left from before.
        .filter(row => !row.ownerCharacterId || byId.has(row.ownerCharacterId))
        .map(row => {
          const held = facilities.filter(
            facility => facility.bastionId === row.id,
          );
          const owner = row.ownerCharacterId
            ? byId.get(row.ownerCharacterId)
            : null;
          const members = owner
            ? [owner]
            : partyMembers(
                characters,
                new Set(held.map(facility => facility.holderCharacterId ?? '')),
              );

          return {
            id: row.id,
            name: row.name,
            kind: owner ? ('character' as const) : ('party' as const),
            ownerId: owner?.id ?? null,
            ownerName: owner?.name ?? null,
            ownerLevel: owner?.level ?? null,
            memberCount: members.length,
            /** Who would keep the shared parts if this were split up. */
            topHolderId: findTopHolder(
              held.map(facility => facility.holderCharacterId),
            ),
            specialFacilityCount: held.length,
            allowance: members.reduce(
              (total, member) => total + allowanceForLevel(member.level),
              0,
            ),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  }),

  get: publicProcedure
    .input(bastionIdInputSchema)
    .query(async ({ ctx, input }) => {
      const bastion = await loadBastion(ctx.db, input.id);

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
        ctx.db.select().from(playerCharacters),
      ]);

      const owner = bastion.ownerCharacterId
        ? characters.find(
            ({ id, deletedAt }) =>
              id === bastion.ownerCharacterId && !deletedAt,
          )
        : null;
      if (bastion.ownerCharacterId && !owner) throw notFound('character');

      const members = owner
        ? [owner]
        : partyMembers(
            characters.filter(character => !character.deletedAt),
            new Set(
              specialFacilities.map(
                facility => facility.holderCharacterId ?? '',
              ),
            ),
          );

      return toBastionDetail({
        bastion,
        owner: owner ? toMember(owner) : null,
        members: members.map(toMember),
        specialFacilities,
        basicFacilities,
        openProjects,
        storageItems,
        characterNames: new Map(characters.map(({ id, name }) => [id, name])),
      });
    }),

  /**
   * A new bastion: per character, the owner's; in party mode, the party's
   * one shared bastion. Either way each member brings two free rooms.
   */
  found: publicProcedure
    .input(foundBastionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const mode = await currentMode(ctx.db);
      if (mode !== input.mode) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            mode === 'party'
              ? 'This campaign shares one bastion for the party.'
              : 'This campaign gives each character their own bastion.',
        });
      }

      if (input.mode === 'party') {
        if ((await liveBastions(ctx.db)).length) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'The party already has a bastion.',
          });
        }
        await Promise.all(
          input.members.map(member =>
            loadLiveCharacter(ctx.db, member.characterId),
          ),
        );

        const [created] = await ctx.db
          .insert(bastions)
          .values({ ownerCharacterId: null, name: input.name })
          .returning();

        await ctx.db
          .insert(bastionBasicFacilities)
          .values(
            input.members.flatMap(member =>
              freeRooms(created!.id, member.characterId, member),
            ),
          );

        return created!;
      }

      const owner = await loadLiveCharacter(ctx.db, input.ownerCharacterId);

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

      await ctx.db
        .insert(bastionBasicFacilities)
        .values(freeRooms(created!.id, owner.id, input));

      return created!;
    }),

  /** A party member who reached level 5 after founding brings their rooms. */
  addFreeRooms: publicProcedure
    .input(addFreeRoomsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const bastion = await loadBastion(ctx.db, input.bastionId);
      const character = await loadLiveCharacter(ctx.db, input.characterId);

      const alreadyBrought =
        await ctx.db.query.bastionBasicFacilities.findFirst({
          where: and(
            eq(bastionBasicFacilities.bastionId, bastion.id),
            eq(bastionBasicFacilities.contributedByCharacterId, character.id),
            isNull(bastionBasicFacilities.deletedAt),
          ),
        });
      if (alreadyBrought) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `${character.name} has already brought their free rooms.`,
        });
      }

      await ctx.db
        .insert(bastionBasicFacilities)
        .values(freeRooms(bastion.id, character.id, input));

      return { id: bastion.id };
    }),

  /**
   * Switches the campaign between one bastion per character and one for the
   * party — merging every bastion into one, or splitting the party's back
   * out by who holds what (DECISIONS #34). Nothing is lost either way.
   */
  setMode: publicProcedure
    .input(setBastionModeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const party = await ensureParty(ctx.db);
      if (party.bastionMode === input.mode) return { mode: input.mode };

      const existing = await liveBastions(ctx.db);
      const now = new Date();

      if (input.mode === 'party') {
        await mergeBastions(ctx.db, existing, input.name, now);
      } else if (existing.length) {
        const keeperId =
          input.keeperCharacterId ??
          (await liveCharacters(ctx.db)).find(character => character.isActive)
            ?.id;
        if (!keeperId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Choose who keeps the shared parts of the bastion.',
          });
        }
        await loadLiveCharacter(ctx.db, keeperId);
        for (const bastion of existing) {
          await splitBastion(ctx.db, bastion, keeperId, now);
        }
      }

      await ctx.db
        .update(parties)
        .set({
          bastionMode: input.mode,
          ...touchSyncMeta({ version: party.version, now }),
        })
        .where(eq(parties.id, CURRENT_PARTY_ID));

      return { mode: input.mode };
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
   * Divestiture: the bastion is given up. Soft-deleted like everything else,
   * with construction under way refunded; the owner is then free to found a
   * new one.
   */
  abandon: publicProcedure
    .input(bastionIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const bastion = await loadBastion(ctx.db, input.id);
      await abandonBastion(ctx.db, bastion, new Date());

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

      // The owner always holds a facility in their own bastion; in the
      // party's, the member it was picked for does.
      const holderId = bastion.ownerCharacterId ?? input.holderCharacterId;
      if (!holderId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Choose which party member takes this facility.',
        });
      }
      const holder = await loadLiveCharacter(ctx.db, holderId);

      if (!input.ignoreRequirements) {
        const held = await liveSpecialFacilities(ctx.db, bastion.id);
        const problems = findEligibilityProblems(facility, holder, {
          byOwner: held
            .filter(row => row.holderCharacterId === holder.id)
            .map(row => row.facilityKey),
          inBastion: held.map(row => row.facilityKey),
        });

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
          holderCharacterId: holder.id,
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
      if (project) await cancelProject(ctx.db, project, now);

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
      if (project) await cancelProject(ctx.db, project, now);

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
      await cancelProject(ctx.db, project, new Date());

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
      const item = await loadStorageItem(ctx.db, input.id);
      if (input.characterId) await loadLiveCharacter(ctx.db, input.characterId);

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
      const item = await loadStorageItem(ctx.db, input.id);

      await ctx.db
        .update(bastionStorageItems)
        .set(tombstoneSyncMeta({ version: item.version, now: new Date() }))
        .where(eq(bastionStorageItems.id, item.id));

      return { id: item.id };
    }),
});
