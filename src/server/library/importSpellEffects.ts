import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spellEffects } from '~/server/db/schema';
import type { Database } from '~/server/db';
import { mapSpellShapeType } from '~/utils/mapMeasurement';
import { generateEffectStoragePath } from '~/utils/effectStorage';
import { pickEffectSourcePath } from '~/server/library/effectCandidates';
import {
  SPELL_EFFECTS_GIT_REF,
  effectFileUrl,
  fetchBinary as defaultFetchBinary,
  type FetchBinary,
} from '~/server/library/effectsSource';

export type ImportProgress = (message: string) => void;

/** Only the fields the matcher needs — the same shape `toSpellRow` output
 * already has, so `importLibrary` can pass its freshly-mapped spell rows
 * straight through without a second query. */
export type SpellEffectCandidate = {
  slug: string;
  shapeType?: string | null;
  damageTypes?: string[];
};

export type ImportSpellEffectsOptions = {
  db: Database;
  spellRows: readonly SpellEffectCandidate[];
  /** Where clips are written on disk. */
  storageDir: string;
  gitRef?: string;
  fetchBinary?: FetchBinary;
  onProgress?: ImportProgress;
};

export type ImportSpellEffectsResult = {
  /** How many spells matched a clip — not how many files were fetched;
   * several commonly share one deduplicated clip. */
  matchedCount: number;
  /** How many distinct clips were actually fetched from GitHub this run
   * (already-on-disk matches from a previous run don't re-download). */
  downloadedCount: number;
  /** Matched, but the fetch or write failed — logged and skipped rather
   * than aborting the rest of the import. */
  failedCount: number;
};

/**
 * Matches each spell to an animated effect clip (`~/server/library/effectCandidates`)
 * and downloads/deduplicates/records it.
 *
 * Idempotent and resilient by the same construction as `importLibrary`
 * itself: `spell_effects` is keyed on `spellSlug` and upserted, clips are
 * content-addressed so a clip already on disk from a previous run is never
 * re-fetched, and a single spell's failure (a flaky fetch, a write error) is
 * caught and counted rather than aborting every spell after it — an
 * animated effect is a bonus on top of a working text library, never a
 * reason to leave one half-imported.
 */
export const importSpellEffects = async ({
  db,
  spellRows,
  storageDir,
  gitRef = SPELL_EFFECTS_GIT_REF,
  fetchBinary: fetchBinaryImpl = defaultFetchBinary,
  onProgress = () => {},
}: ImportSpellEffectsOptions): Promise<ImportSpellEffectsResult> => {
  await mkdir(storageDir, { recursive: true });

  // Within one run, several spells matching the same clip must resolve to
  // the same storage path without re-fetching it once per spell.
  const storagePathBySourcePath = new Map<string, string>();

  let matchedCount = 0;
  let downloadedCount = 0;
  let failedCount = 0;

  for (const spell of spellRows) {
    const shapeType = mapSpellShapeType(spell.shapeType ?? null);
    if (!shapeType) continue;

    const sourcePath = pickEffectSourcePath(spell.damageTypes ?? [], shapeType);
    if (!sourcePath) continue;

    matchedCount += 1;

    try {
      let storagePath = storagePathBySourcePath.get(sourcePath);

      if (!storagePath) {
        storagePath = generateEffectStoragePath(sourcePath);
        const absolutePath = join(storageDir, storagePath);
        const alreadyOnDisk = await stat(absolutePath).catch(() => null);

        if (!alreadyOnDisk) {
          onProgress(`Fetching effect ${sourcePath}`);
          const bytes = await fetchBinaryImpl(
            effectFileUrl(sourcePath, gitRef),
          );
          await writeFile(absolutePath, Buffer.from(bytes));
          downloadedCount += 1;
        }

        storagePathBySourcePath.set(sourcePath, storagePath);
      }

      const { size } = await stat(join(storageDir, storagePath));

      await db
        .insert(spellEffects)
        .values({
          spellSlug: spell.slug,
          sourcePath,
          storagePath,
          byteSize: size,
        })
        .onConflictDoUpdate({
          target: spellEffects.spellSlug,
          set: { sourcePath, storagePath, byteSize: size },
        });
    } catch (error) {
      failedCount += 1;
      onProgress(
        `Effect for ${spell.slug} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return { matchedCount, downloadedCount, failedCount };
};
