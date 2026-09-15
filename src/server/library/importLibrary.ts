import { sql } from 'drizzle-orm';
import {
  characterClassFeatures,
  characterClasses,
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
import { toCharacterClassRow } from '~/server/library/mappers/toCharacterClassRow';
import { toClassFeatureRow } from '~/server/library/mappers/toClassFeatureRow';
import { partitionByParent } from '~/server/library/mappers/partitionByParent';
import { chunk } from '~/utils/chunk';
import { importSpellEffects } from '~/server/library/importSpellEffects';
import type { FetchBinary } from '~/server/library/effectsSource';

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
  classFeatures: 120,
} as const;

export type ImportProgress = (message: string) => void;

export type ImportLibraryOptions = {
  db: Database;
  gitRef?: string;
  fetchJson?: FetchJson;
  onProgress?: ImportProgress;
  /** Where animated spell-effect clips are written. Effects are matched and
   * fetched only when this is set — omitting it (as the existing text-only
   * integration test does) skips that step entirely, rather than reaching
   * the network for video with no directory to put it in. */
  effectsStorageDir?: string;
  effectsGitRef?: string;
  fetchBinary?: FetchBinary;
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
  characterClassCount: number;
  classFeatureCount: number;
  orphanedActions: number;
  orphanedAttacks: number;
  orphanedTraits: number;
  orphanedCastingOptions: number;
  orphanedClassFeatures: number;
  /** How many spells matched an animated effect — 0 when `effectsStorageDir`
   * was not given. */
  effectCount: number;
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
  effectsStorageDir,
  effectsGitRef,
  fetchBinary,
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
      characterClassFixtures,
      classFeatureFixtures,
    ] = await Promise.all([
      loadFixture('Creature', { gitRef, fetchJson }),
      loadFixture('CreatureAction', { gitRef, fetchJson }),
      loadFixture('CreatureActionAttack', { gitRef, fetchJson }),
      loadFixture('CreatureTrait', { gitRef, fetchJson }),
      loadFixture('ConditionDescription', { gitRef, fetchJson }),
      loadFixture('Spell', { gitRef, fetchJson }),
      loadFixture('SpellCastingOption', { gitRef, fetchJson }),
      loadFixture('CharacterClass', { gitRef, fetchJson }),
      loadFixture('ClassFeature', { gitRef, fetchJson }),
    ]);

    const creatureRows = creatureFixtures.map(toCreatureRow);
    const creatureSlugs = new Set(creatureRows.map(row => row.slug));

    // Computed before actions/spells (not after, as a plain reading order
    // would suggest) because both `toActionRow` and `toSpellRow` resolve a
    // parsed condition key (e.g. "paralyzed") to its full `conditions.slug`
    // through this map — a pure parser has no DB access of its own.
    const conditionRows = conditionFixtures.map(toConditionRow);
    const conditionSlugByKey = new Map(
      conditionRows.map(row => [row.key, row.slug]),
    );

    const actionPartition = partitionByParent(
      actionFixtures.map(fixture => toActionRow(fixture, conditionSlugByKey)),
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

    const spellRows = spellFixtures.map(fixture =>
      toSpellRow(fixture, conditionSlugByKey),
    );
    const spellSlugs = new Set(spellRows.map(row => row.slug));
    const castingOptionPartition = partitionByParent(
      castingOptionFixtures.map(toSpellCastingOptionRow),
      'spellSlug',
      spellSlugs,
    );

    const characterClassRows = characterClassFixtures.map(toCharacterClassRow);
    const characterClassSlugs = new Set(
      characterClassRows.map(row => row.slug),
    );
    const classFeaturePartition = partitionByParent(
      classFeatureFixtures.map(toClassFeatureRow),
      'classSlug',
      characterClassSlugs,
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

    // Conditions before actions/spells: both now carry an
    // `appliesConditionSlug` FK onto this table (issue #5, milestone 9).
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

    // A single, unchunked insert: `character_classes` self-references
    // (`subclassOfSlug`) within this same set, so every row must land in one
    // statement — SQLite only checks a deferred-by-statement foreign key once
    // the whole statement finishes, and splitting into chunks could insert a
    // subclass before the base class it points to. At 24 rows today this is
    // nowhere near the variable-count ceiling that motivates chunking above.
    onProgress(`Writing ${characterClassRows.length} character classes`);
    if (characterClassRows.length > 0) {
      await db
        .insert(characterClasses)
        .values(characterClassRows)
        .onConflictDoUpdate({
          target: characterClasses.slug,
          set: conflictUpdateSet(characterClasses, characterClassRows[0]),
        });
    }

    onProgress(
      `Writing ${classFeaturePartition.kept.length} character class features`,
    );
    for (const rows of chunk(
      classFeaturePartition.kept,
      CHUNK_SIZES.classFeatures,
    )) {
      await db
        .insert(characterClassFeatures)
        .values(rows)
        .onConflictDoUpdate({
          target: characterClassFeatures.slug,
          set: conflictUpdateSet(characterClassFeatures, rows[0]),
        });
    }

    // A bonus on top of a working text library, never a reason to fail it:
    // caught here rather than by the outer `catch`, so a network hiccup
    // fetching video leaves `import_runs` reporting a successful import with
    // zero effects, not a failed one with zero of everything.
    let effectCount = 0;
    if (effectsStorageDir) {
      try {
        onProgress('Matching spells to animated effects');
        const effectsResult = await importSpellEffects({
          db,
          spellRows,
          storageDir: effectsStorageDir,
          gitRef: effectsGitRef,
          fetchBinary,
          onProgress,
        });
        effectCount = effectsResult.matchedCount;
        onProgress(
          `Matched ${effectsResult.matchedCount} spells to effects (${effectsResult.downloadedCount} clip(s) fetched, ${effectsResult.failedCount} failed)`,
        );
      } catch (error) {
        onProgress(
          `Spell effects import failed, continuing without them: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
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
      characterClassCount: characterClassRows.length,
      classFeatureCount: classFeaturePartition.kept.length,
      orphanedActions: actionPartition.orphaned.length,
      orphanedAttacks: attackPartition.orphaned.length,
      orphanedTraits: traitPartition.orphaned.length,
      orphanedCastingOptions: castingOptionPartition.orphaned.length,
      orphanedClassFeatures: classFeaturePartition.orphaned.length,
      effectCount,
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
        characterClassCount: result.characterClassCount,
        classFeatureCount: result.classFeatureCount,
        effectCount: result.effectCount,
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
