import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
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
import { buildDefaultWeaponAction } from '~/server/trpc/helpers/buildDefaultWeaponAction';
import { buildDefaultCharacterSpells } from '~/server/trpc/helpers/buildDefaultCharacterSpells';
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

/**
 * Selects every currently-live row of one child table for a PC and
 * tombstones it — the "fetch doomed rows, then soft-delete them" half of the
 * full-replace pattern, shared by `replaceCombatDataRows`,
 * `replaceSpellSlotsAndResources`, and `remove` so it's written once instead
 * of once per table per call site. `Table` is narrowed to the four child
 * tables below, which all share `id`/`version`/`playerCharacterId` from
 * `syncMeta`.
 */
type SyncMetaChildTable =
  | typeof playerCharacterActions
  | typeof playerCharacterSpells
  | typeof playerCharacterSpellSlots
  | typeof playerCharacterResources;

async function tombstoneLiveChildRows(
  db: Database,
  table: SyncMetaChildTable,
  isLiveClause: SQL,
  playerCharacterId: string,
  now: Date,
): Promise<void> {
  // Drizzle's column/update types don't resolve cleanly through a union
  // table parameter — the four tables above are known at every call site to
  // share `id`/`version`/`playerCharacterId` from `syncMeta`, which is what
  // this function actually relies on.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const anyTable = table as any;
  const doomed: { id: string; version: number }[] = await db
    .select({ id: anyTable.id, version: anyTable.version })
    .from(anyTable)
    .where(
      and(eq(anyTable.playerCharacterId, playerCharacterId), isLiveClause),
    );

  await Promise.all(
    doomed.map(row =>
      db
        .update(anyTable)
        .set(tombstoneSyncMeta({ version: row.version, now }))
        .where(eq(anyTable.id, row.id)),
    ),
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

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

  await Promise.all([
    tombstoneLiveChildRows(
      db,
      playerCharacterActions,
      isLiveAction,
      playerCharacterId,
      now,
    ),
    tombstoneLiveChildRows(
      db,
      playerCharacterSpells,
      isLiveSpell,
      playerCharacterId,
      now,
    ),
    tombstoneLiveChildRows(
      db,
      playerCharacterSpellSlots,
      isLiveSlot,
      playerCharacterId,
      now,
    ),
    tombstoneLiveChildRows(
      db,
      playerCharacterResources,
      isLiveResource,
      playerCharacterId,
      now,
    ),
  ]);

  if (actions.length) {
    const createdActions = await db
      .insert(playerCharacterActions)
      .values(
        actions.map((action, index) => ({
          playerCharacterId,
          name: action.name,
          desc: action.desc,
          actionType: action.actionType,
          sortOrder: index,
          legendaryActionCost: action.legendaryActionCost ?? null,
        })),
      )
      .returning();

    // A single multi-row INSERT...RETURNING returns rows in VALUES order in
    // SQLite, so positional zip is safe here.
    const attackRows = actions.flatMap((action, index) => {
      const createdAction = createdActions[index];
      if (!action.attack || !createdAction) return [];
      const { attack } = action;
      return [
        {
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
        },
      ];
    });

    if (attackRows.length) {
      await db.insert(playerCharacterActionAttacks).values(attackRows);
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

/**
 * Regenerates just a PC's spell-slot and resource rows for a new level,
 * leaving actions and spells untouched — those may carry a DM's manual
 * edits that `applyClassTemplate`'s doc comment explicitly says not to
 * guess at. Spell slots and resources are both pure functions of class +
 * level (`buildClassTemplateMaterialization`), so they're safe to recompute
 * on their own whenever level changes, without a full class-template
 * re-apply.
 */
const replaceSpellSlotsAndResources = async (
  db: Database,
  playerCharacterId: string,
  spellSlots: readonly CharacterSpellSlotInput[],
  resources: readonly ResourceRowInput[],
) => {
  const now = new Date();

  await Promise.all([
    tombstoneLiveChildRows(
      db,
      playerCharacterSpellSlots,
      isLiveSlot,
      playerCharacterId,
      now,
    ),
    tombstoneLiveChildRows(
      db,
      playerCharacterResources,
      isLiveResource,
      playerCharacterId,
      now,
    ),
  ]);

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

      // A level change on a character that already has a class applied
      // would otherwise leave its materialized spell slots/resources stale
      // for the new level until the DM manually re-runs the class wizard —
      // regenerate them here too, since both are pure functions of class +
      // level. Actions/spells are deliberately left untouched (may carry a
      // DM's manual edits `applyClassTemplate` doesn't know about).
      if (existing.characterClassSlug && input.level !== existing.level) {
        const characterClass = await ctx.db.query.characterClasses.findFirst({
          where: eq(characterClasses.slug, existing.characterClassSlug),
        });
        if (characterClass) {
          const materialization = buildClassTemplateMaterialization(
            characterClass,
            input.level,
          );
          await replaceSpellSlotsAndResources(
            ctx.db,
            input.id,
            materialization.spellSlots,
            materialization.resources,
          );
        }
      }

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

      const now = new Date();

      await ctx.db
        .update(playerCharacters)
        .set(tombstoneSyncMeta({ version: existing.version, now }))
        .where(eq(playerCharacters.id, input.id));

      // Tombstone the character's own combat-data child rows too, so they
      // don't outlive their parent as orphaned "live" rows — mirrors
      // `replaceCombatDataRows`' own tombstone step, just with nothing to
      // re-insert afterward.
      await Promise.all([
        tombstoneLiveChildRows(
          ctx.db,
          playerCharacterActions,
          isLiveAction,
          input.id,
          now,
        ),
        tombstoneLiveChildRows(
          ctx.db,
          playerCharacterSpells,
          isLiveSpell,
          input.id,
          now,
        ),
        tombstoneLiveChildRows(
          ctx.db,
          playerCharacterSpellSlots,
          isLiveSlot,
          input.id,
          now,
        ),
        tombstoneLiveChildRows(
          ctx.db,
          playerCharacterResources,
          isLiveResource,
          input.id,
          now,
        ),
      ]);

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
   * (deterministic, so always derivable from class+level), **plus** a
   * starter kit of actions/spells so the PC isn't left with nothing a
   * simulation can do — a class-typical weapon attack
   * (`buildDefaultWeaponAction`) and, for a spellcasting class, a small
   * offensive-leaning cantrip/spell selection (`buildDefaultCharacterSpells`,
   * via `selectDefaultCharacterSpells`). None of this is the player's actual
   * choice — it's an educated guess a DM remains free to replace wholesale
   * via the class wizard's edit step (`characters.updateCombatData`), same as
   * ever.
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

      const defaultWeaponAction = buildDefaultWeaponAction(
        characterClass,
        input.level,
        existing.initiativeModifier,
      );

      const defaultSpells = await buildDefaultCharacterSpells(
        ctx.db,
        input.characterClassSlug,
        characterClass.casterType,
        materialization.spellSlots.map(slot => slot.spellLevel),
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
        [defaultWeaponAction],
        defaultSpells,
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
