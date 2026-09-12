import { createHash } from 'node:crypto';

/**
 * Content-addressed storage filename for an animated spell-effect clip,
 * derived from its upstream repo-relative path (`~/server/library/effectCandidates`).
 *
 * Unlike an uploaded map (`~/utils/mapStorage`, random-UUID-named because two
 * uploads are never the same file), many spells commonly match the exact
 * same upstream clip — every fire-damage circle spell, for instance. Hashing
 * the source path means every one of them resolves to the same filename, so
 * the clip is fetched and stored once no matter how many spells reference
 * it, rather than once per spell.
 */
export const generateEffectStoragePath = (sourcePath: string): string =>
  `${createHash('sha1').update(sourcePath).digest('hex')}.webm`;
