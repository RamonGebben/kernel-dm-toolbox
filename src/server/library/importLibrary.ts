import { sql } from 'drizzle-orm';
import {
  conditions,
  creatureActionAttacks,
  creatureActions,
  creatureTraits,
  creatures,
  importRuns,
  spellCastingOptions,
  spells,
} from '~/server/db/schema';
import type { Database } from '~/server/db';
import {
  LIBRARY_GIT_REF,
  fetchJson as defaultFetchJson,
  loadFixture,
  type FetchJson,
} from '~/server/library/source';
import { toCreatureRow } from '~/server/library/mappers/toCreatureRow';
import { toActionRow } from '~/server/library/mappers/toActionRow';
import { toAttackRow } from '~/server/library/mappers/toAttackRow';
import { toTraitRow } from '~/server/library/mappers/toTraitRow';
import { toConditionRow } from '~/server/library/mappers/toConditionRow';
import { toSpellRow } from '~/server/library/mappers/toSpellRow';
import { toSpellCastingOptionRow } from '~/server/library/mappers/toSpellCastingOptionRow';
import { partitionByParent } from '~/server/library/mappers/partitionByParent';
import { chunk } from '~/utils/chunk';

/**
 * SQLite binds one variable per column per row. The creature table is the
 * widest at roughly seventy columns, so chunks are sized to stay well inside
 * the statement variable limit on every build of SQLite.
 */
const CHUNK_SIZES = {
  creatures: 10,
  actions: 60,
  attacks: 50,
  traits: 120,
  conditions: 120,
  spells: 20,
  castingOptions: 60,
} as const;

export type ImportProgress = (message: string) => void;

export type ImportLibraryOptions = {
  db: Database;
  gitRef?: string;
  fetchJson?: FetchJson;
  onProgress?: ImportProgress;
};

export type ImportLibraryResult = {
  gitRef: string;
  creatureCount: number;
  actionCount: number;
  attackCount: number;
  traitCount: number;
  conditionCount: number;
  spellCount: number;
  castingOptionCount: number;
  orphanedActions: number;
  orphanedAttacks: number;
  orphanedTraits: number;
  orphanedCastingOptions: number;
};

/**
 * Imports the Open5e library.
 *
 * Idempotent by construction: every table is keyed on the upstream slug and
 * written with an upsert, so running it twice changes nothing and re-running
 * it picks up upstream corrections. Rows are never deleted, because combatants
 * hold foreign keys into `creatures` and a running fight must survive a
 * refresh.
 *
 * The database handle is a parameter rather than an import so the same
 * function serves the CLI, a future "refresh library" mutation, and tests
 * against a scratch database.
 */
export const importLibrary = async ({
  db,
  gitRef = LIBRARY_GIT_REF,
  fetchJson = defaultFetchJson,
  onProgress = () => {},
}: ImportLibraryOptions): Promise<ImportLibraryResult> => {
  const startedAt = new Date();
  const [run] = await db
    .insert(importRuns)
    .values({ gitRef, startedAt })
    .returning();

  const failRun = async (error: unknown): Promise<never> => {
    await db
      .update(importRuns)
      .set({
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      })
      .where(sql`${importRuns.id} = ${run.id}`);

    throw error;
  };

  try {
    onProgress(`Fetching fixtures at ${gitRef}`);
    const [
      creatureFixtures,
      actionFixtures,
      attackFixtures,
      traitFixtures,
      conditionFixtures,
      spellFixtures,
      castingOptionFixtures,
    ] = await Promise.all([
      loadFixture('Creature', { gitRef, fetchJson }),
      loadFixture('CreatureAction', { gitRef, fetchJson }),
      loadFixture('CreatureActionAttack', { gitRef, fetchJson }),
      loadFixture('CreatureTrait', { gitRef, fetchJson }),
      loadFixture('ConditionDescription', { gitRef, fetchJson }),
      loadFixture('Spell', { gitRef, fetchJson }),
      loadFixture('SpellCastingOption', { gitRef, fetchJson }),
    ]);

    const creatureRows = creatureFixtures.map(toCreatureRow);
    const creatureSlugs = new Set(creatureRows.map(row => row.slug));

    const actionPartition = partitionByParent(
      actionFixtures.map(toActionRow),
      'creatureSlug',
      creatureSlugs,
    );
    const actionSlugs = new Set(actionPartition.kept.map(row => row.slug));

    const attackPartition = partitionByParent(
      attackFixtures.map(toAttackRow),
      'actionSlug',
      actionSlugs,
    );
    const traitPartition = partitionByParent(
      traitFixtures.map(toTraitRow),
      'creatureSlug',
      creatureSlugs,
    );
    const conditionRows = conditionFixtures.map(toConditionRow);

    const spellRows = spellFixtures.map(toSpellRow);
    const spellSlugs = new Set(spellRows.map(row => row.slug));
    const castingOptionPartition = partitionByParent(
      castingOptionFixtures.map(toSpellCastingOptionRow),
      'spellSlug',
      spellSlugs,
    );

    // Parents before children, so a foreign key is never briefly unsatisfied.
    onProgress(`Writing ${creatureRows.length} creatures`);
    for (const rows of chunk(creatureRows, CHUNK_SIZES.creatures)) {
      await db
        .insert(creatures)
        .values(rows)
        .onConflictDoUpdate({
          target: creatures.slug,
          set: conflictUpdateSet(creatures, rows[0]),
        });
    }

    onProgress(`Writing ${actionPartition.kept.length} actions`);
    for (const rows of chunk(actionPartition.kept, CHUNK_SIZES.actions)) {
      await db
        .insert(creatureActions)
        .values(rows)
        .onConflictDoUpdate({
          target: creatureActions.slug,
          set: conflictUpdateSet(creatureActions, rows[0]),
        });
    }

    onProgress(`Writing ${attackPartition.kept.length} attacks`);
    for (const rows of chunk(attackPartition.kept, CHUNK_SIZES.attacks)) {
      await db
        .insert(creatureActionAttacks)
        .values(rows)
        .onConflictDoUpdate({
          target: creatureActionAttacks.slug,
          set: conflictUpdateSet(creatureActionAttacks, rows[0]),
        });
    }

    onProgress(`Writing ${traitPartition.kept.length} traits`);
    for (const rows of chunk(traitPartition.kept, CHUNK_SIZES.traits)) {
      await db
        .insert(creatureTraits)
        .values(rows)
        .onConflictDoUpdate({
          target: creatureTraits.slug,
          set: conflictUpdateSet(creatureTraits, rows[0]),
        });
    }

    onProgress(`Writing ${conditionRows.length} conditions`);
    for (const rows of chunk(conditionRows, CHUNK_SIZES.conditions)) {
      await db
        .insert(conditions)
        .values(rows)
        .onConflictDoUpdate({
          target: conditions.slug,
          set: conflictUpdateSet(conditions, rows[0]),
        });
    }

    onProgress(`Writing ${spellRows.length} spells`);
    for (const rows of chunk(spellRows, CHUNK_SIZES.spells)) {
      await db
        .insert(spells)
        .values(rows)
        .onConflictDoUpdate({
          target: spells.slug,
          set: conflictUpdateSet(spells, rows[0]),
        });
    }

    onProgress(
      `Writing ${castingOptionPartition.kept.length} spell casting options`,
    );
    for (const rows of chunk(
      castingOptionPartition.kept,
      CHUNK_SIZES.castingOptions,
    )) {
      await db
        .insert(spellCastingOptions)
        .values(rows)
        .onConflictDoUpdate({
          target: spellCastingOptions.id,
          set: conflictUpdateSet(spellCastingOptions, rows[0]),
        });
    }

    const result: ImportLibraryResult = {
      gitRef,
      creatureCount: creatureRows.length,
      actionCount: actionPartition.kept.length,
      attackCount: attackPartition.kept.length,
      traitCount: traitPartition.kept.length,
      conditionCount: conditionRows.length,
      spellCount: spellRows.length,
      castingOptionCount: castingOptionPartition.kept.length,
      orphanedActions: actionPartition.orphaned.length,
      orphanedAttacks: attackPartition.orphaned.length,
      orphanedTraits: traitPartition.orphaned.length,
      orphanedCastingOptions: castingOptionPartition.orphaned.length,
    };

    await db
      .update(importRuns)
      .set({
        finishedAt: new Date(),
        creatureCount: result.creatureCount,
        actionCount: result.actionCount,
        attackCount: result.attackCount,
        traitCount: result.traitCount,
        conditionCount: result.conditionCount,
        spellCount: result.spellCount,
        castingOptionCount: result.castingOptionCount,
      })
      .where(sql`${importRuns.id} = ${run.id}`);

    return result;
  } catch (error) {
    return failRun(error);
  }
};

/**
 * Builds the `SET` clause of an upsert from the columns actually present on a
 * row, so adding a column to the schema cannot silently leave it un-refreshed.
 */
const conflictUpdateSet = <TTable extends { _: { columns: object } }>(
  table: TTable,
  sampleRow: object,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.keys(sampleRow)
      .filter(column => column !== 'slug' && column !== 'id')
      .map(column => [column, sql.raw(`excluded.${toSnakeCase(column)}`)]),
  );

const toSnakeCase = (value: string): string =>
  value.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
