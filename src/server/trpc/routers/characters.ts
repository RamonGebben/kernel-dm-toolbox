import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import {
  characterClasses,
  playerCharacterActionAttacks,
  playerCharacterActions,
  playerCharacterResources,
  playerCharacterSpellSlots,
  playerCharacterSpells,
  playerCharacters,
} from '~/server/db/schema';
import {
  applyClassTemplateInputSchema,
  characterIdInputSchema,
  createCharacterInputSchema,
  updateCharacterInputSchema,
  updateCombatDataInputSchema,
} from '~/server/trpc/schemas/characters';
import type {
  CharacterActionInput,
  CharacterSpellInput,
  CharacterSpellSlotInput,
} from '~/server/trpc/schemas/characters';
import {
  tombstoneSyncMeta,
  touchSyncMeta,
} from '~/server/trpc/helpers/touchSyncMeta';
import { buildClassTemplateMaterialization } from '~/server/trpc/helpers/buildClassTemplateMaterialization';
import type { Database } from '~/server/db';

/** Live rows only — a tombstoned character is gone as far as the app cares. */
const isLive = isNull(playerCharacters.deletedAt);
const isLiveAction = isNull(playerCharacterActions.deletedAt);
const isLiveSpell = isNull(playerCharacterSpells.deletedAt);
const isLiveSlot = isNull(playerCharacterSpellSlots.deletedAt);
const isLiveResource = isNull(playerCharacterResources.deletedAt);

const loadLiveCharacter = async (db: Database, id: string) => {
  const character = await db.query.playerCharacters.findFirst({
    where: and(eq(playerCharacters.id, id), isLive),
  });

  if (!character) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'That character no longer exists.',
    });
  }

  return character;
};

/** Accepted by both a DM's zod-validated edit and the deterministic
 * materializer's output — the only difference is `null` vs. `undefined` for
 * "no cap", which the insert below normalizes away anyway. */
type ResourceRowInput = {
  resourceKey: string;
  name: string;
  maxUses?: number | null;
  isUnlimited: boolean;
  resetsOn: 'SHORT_REST' | 'LONG_REST';
};

/**
 * Replaces every materialized action(+attack)/spell/spell-slot/resource row
 * for a PC in one go — the same "full replace on save" shape
 * `customCreatures`' `replaceChildRows` uses, and the same soft-delete
 * convention: superseded rows are tombstoned, never hard-deleted. An attack
 * hanging off a tombstoned action is left as-is rather than tombstoned in
 * turn, matching `customCreatures`' own established behavior — it simply
 * becomes unreachable once its parent action no longer shows up in a live
 * query.
 */
const replaceCombatDataRows = async (
  db: Database,
  playerCharacterId: string,
  actions: readonly CharacterActionInput[],
  spells: readonly CharacterSpellInput[],
  spellSlots: readonly CharacterSpellSlotInput[],
  resources: readonly ResourceRowInput[],
) => {
  const now = new Date();

  const [doomedActions, doomedSpells, doomedSlots, doomedResources] =
    await Promise.all([
      db
        .select({
          id: playerCharacterActions.id,
          version: playerCharacterActions.version,
        })
        .from(playerCharacterActions)
        .where(
          and(
            eq(playerCharacterActions.playerCharacterId, playerCharacterId),
            isLiveAction,
          ),
        ),
      db
        .select({
          id: playerCharacterSpells.id,
          version: playerCharacterSpells.version,
        })
        .from(playerCharacterSpells)
        .where(
          and(
            eq(playerCharacterSpells.playerCharacterId, playerCharacterId),
            isLiveSpell,
          ),
        ),
      db
        .select({
          id: playerCharacterSpellSlots.id,
          version: playerCharacterSpellSlots.version,
        })
        .from(playerCharacterSpellSlots)
        .where(
          and(
            eq(playerCharacterSpellSlots.playerCharacterId, playerCharacterId),
            isLiveSlot,
          ),
        ),
      db
        .select({
          id: playerCharacterResources.id,
          version: playerCharacterResources.version,
        })
        .from(playerCharacterResources)
        .where(
          and(
            eq(playerCharacterResources.playerCharacterId, playerCharacterId),
            isLiveResource,
          ),
        ),
    ]);

  await Promise.all([
    ...doomedActions.map(row =>
      db
        .update(playerCharacterActions)
        .set(tombstoneSyncMeta({ version: row.version, now }))
        .where(eq(playerCharacterActions.id, row.id)),
    ),
    ...doomedSpells.map(row =>
      db
        .update(playerCharacterSpells)
        .set(tombstoneSyncMeta({ version: row.version, now }))
        .where(eq(playerCharacterSpells.id, row.id)),
    ),
    ...doomedSlots.map(row =>
      db
        .update(playerCharacterSpellSlots)
        .set(tombstoneSyncMeta({ version: row.version, now }))
        .where(eq(playerCharacterSpellSlots.id, row.id)),
    ),
    ...doomedResources.map(row =>
      db
        .update(playerCharacterResources)
        .set(tombstoneSyncMeta({ version: row.version, now }))
        .where(eq(playerCharacterResources.id, row.id)),
    ),
  ]);

  for (const [index, action] of actions.entries()) {
    const [createdAction] = await db
      .insert(playerCharacterActions)
      .values({
        playerCharacterId,
        name: action.name,
        desc: action.desc,
        actionType: action.actionType,
        sortOrder: index,
        legendaryActionCost: action.legendaryActionCost ?? null,
      })
      .returning();

    if (action.attack && createdAction) {
      const { attack } = action;

      await db.insert(playerCharacterActionAttacks).values({
        playerCharacterActionId: createdAction.id,
        name: attack.name,
        attackType: attack.attackType ?? null,
        toHitMod: attack.toHitMod ?? null,
        reach: attack.reach ?? null,
        range: attack.range ?? null,
        longRange: attack.longRange ?? null,
        targetCreatureOnly: attack.targetCreatureOnly,
        damageDieCount: attack.damageDieCount ?? null,
        damageDieType: attack.damageDieType ?? null,
        damageBonus: attack.damageBonus ?? null,
        damageType: attack.damageType ?? null,
        extraDamageDieCount: attack.extraDamageDieCount ?? null,
        extraDamageDieType: attack.extraDamageDieType ?? null,
        extraDamageBonus: attack.extraDamageBonus ?? null,
        extraDamageType: attack.extraDamageType ?? null,
      });
    }
  }

  if (spells.length) {
    await db.insert(playerCharacterSpells).values(
      spells.map(spell => ({
        playerCharacterId,
        spellSlug: spell.spellSlug,
        isPrepared: spell.isPrepared,
        isAlwaysAvailable: spell.isAlwaysAvailable,
      })),
    );
  }

  if (spellSlots.length) {
    await db.insert(playerCharacterSpellSlots).values(
      spellSlots.map(slot => ({
        playerCharacterId,
        spellLevel: slot.spellLevel,
        maxSlots: slot.maxSlots,
      })),
    );
  }

  if (resources.length) {
    await db.insert(playerCharacterResources).values(
      resources.map(resource => ({
        playerCharacterId,
        resourceKey: resource.resourceKey,
        name: resource.name,
        maxUses: resource.isUnlimited ? null : (resource.maxUses ?? null),
        isUnlimited: resource.isUnlimited,
        resetsOn: resource.resetsOn,
      })),
    );
  }
};

export const charactersRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(playerCharacters)
      .where(isLive)
      .orderBy(asc(playerCharacters.name)),
  ),

  create: publicProcedure
    .input(createCharacterInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(playerCharacters)
        .values({
          name: input.name,
          playerName: input.playerName || null,
          armorClass: input.armorClass,
          maxHitPoints: input.maxHitPoints,
          initiativeModifier: input.initiativeModifier,
          level: input.level,
        })
        .returning();

      return created;
    }),

  update: publicProcedure
    .input(updateCharacterInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.playerCharacters.findFirst({
        where: and(eq(playerCharacters.id, input.id), isLive),
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That character no longer exists.',
        });
      }

      const [updated] = await ctx.db
        .update(playerCharacters)
        .set({
          name: input.name,
          playerName: input.playerName || null,
          armorClass: input.armorClass,
          maxHitPoints: input.maxHitPoints,
          initiativeModifier: input.initiativeModifier,
          level: input.level,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(playerCharacters.id, input.id))
        .returning();

      return updated;
    }),

  /** Soft delete. There is no hard delete anywhere in this app. */
  remove: publicProcedure
    .input(characterIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.playerCharacters.findFirst({
        where: and(eq(playerCharacters.id, input.id), isLive),
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That character no longer exists.',
        });
      }

      await ctx.db
        .update(playerCharacters)
        .set(tombstoneSyncMeta({ version: existing.version, now: new Date() }))
        .where(eq(playerCharacters.id, input.id));

      return { id: input.id };
    }),

  /**
   * The raw materialized rows for one PC — actions(+attacks), spells, spell
   * slots and resources. Feeds the class wizard's post-apply edit view, the
   * same role `customCreatures.getRaw` plays for a custom creature.
   */
  getCombatData: publicProcedure
    .input(characterIdInputSchema)
    .query(async ({ ctx, input }) => {
      const character = await loadLiveCharacter(ctx.db, input.id);

      const [actions, spells, spellSlots, resources] = await Promise.all([
        ctx.db
          .select()
          .from(playerCharacterActions)
          .where(
            and(
              eq(playerCharacterActions.playerCharacterId, input.id),
              isLiveAction,
            ),
          )
          .orderBy(asc(playerCharacterActions.sortOrder)),
        ctx.db
          .select()
          .from(playerCharacterSpells)
          .where(
            and(
              eq(playerCharacterSpells.playerCharacterId, input.id),
              isLiveSpell,
            ),
          ),
        ctx.db
          .select()
          .from(playerCharacterSpellSlots)
          .where(
            and(
              eq(playerCharacterSpellSlots.playerCharacterId, input.id),
              isLiveSlot,
            ),
          )
          .orderBy(asc(playerCharacterSpellSlots.spellLevel)),
        ctx.db
          .select()
          .from(playerCharacterResources)
          .where(
            and(
              eq(playerCharacterResources.playerCharacterId, input.id),
              isLiveResource,
            ),
          ),
      ]);

      const attacks = actions.length
        ? await ctx.db
            .select()
            .from(playerCharacterActionAttacks)
            .where(
              inArray(
                playerCharacterActionAttacks.playerCharacterActionId,
                actions.map(action => action.id),
              ),
            )
        : [];

      return {
        character,
        actions: actions.map(action => ({
          ...action,
          attack:
            attacks.find(
              attack => attack.playerCharacterActionId === action.id,
            ) ?? null,
        })),
        spells,
        spellSlots,
        resources,
      };
    }),

  /**
   * Materializes a class/subclass/level onto a PC: writes the class fields
   * onto `player_characters` and regenerates its spell-slot and resource
   * rows from `~/content/classProgression`/`spellSlotsByCasterType`
   * (deterministic, so always derivable from class+level). Actions, attacks
   * and known/prepared spells are cleared, not guessed — see
   * `buildClassTemplateMaterialization`'s own doc comment for why.
   *
   * A second call on a PC that already has a class is a full re-apply: every
   * materialized row is wiped and recreated. The UI confirms this with the
   * DM before calling — the server does not attempt to diff or preserve a
   * DM's manual edits against the new template.
   */
  applyClassTemplate: publicProcedure
    .input(applyClassTemplateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadLiveCharacter(ctx.db, input.id);

      const characterClass = await ctx.db.query.characterClasses.findFirst({
        where: eq(characterClasses.slug, input.characterClassSlug),
      });

      if (!characterClass) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That class does not exist.',
        });
      }

      if (input.subclassSlug) {
        const subclass = await ctx.db.query.characterClasses.findFirst({
          where: eq(characterClasses.slug, input.subclassSlug),
        });

        if (!subclass || subclass.subclassOfSlug !== characterClass.slug) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'That subclass does not belong to the chosen class.',
          });
        }
      }

      const materialization = buildClassTemplateMaterialization(
        characterClass,
        input.level,
      );

      const [updated] = await ctx.db
        .update(playerCharacters)
        .set({
          characterClassSlug: input.characterClassSlug,
          subclassSlug: input.subclassSlug ?? null,
          level: input.level,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(playerCharacters.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That character no longer exists.',
        });
      }

      await replaceCombatDataRows(
        ctx.db,
        input.id,
        [],
        [],
        materialization.spellSlots,
        materialization.resources,
      );

      return updated;
    }),

  /**
   * Saves a DM's edits to a PC's materialized actions/spells/slots/
   * resources — full replace, mirroring `customCreatures.update`'s own
   * child-row handling.
   */
  updateCombatData: publicProcedure
    .input(updateCombatDataInputSchema)
    .mutation(async ({ ctx, input }) => {
      await loadLiveCharacter(ctx.db, input.id);

      await replaceCombatDataRows(
        ctx.db,
        input.id,
        input.actions,
        input.spells,
        input.spellSlots,
        input.resources,
      );

      return { id: input.id };
    }),
});
