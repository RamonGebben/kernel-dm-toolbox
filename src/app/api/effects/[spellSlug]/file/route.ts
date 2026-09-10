import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { eq } from 'drizzle-orm';
import { env } from '~/env';
import { getDb } from '~/server/db';
import { spellEffects } from '~/server/db/schema';
import { resolveWithinStorageRoot } from '~/utils/mapStorage';

/**
 * Serves an animated spell-effect clip, looked up by spell slug — never by
 * a client-supplied filesystem path. Mirrors `/api/maps/[mapId]/file`
 * exactly, `resolveWithinStorageRoot` included: it's generic over which
 * storage root it's resolving against, so there's nothing map-specific to
 * duplicate. Range support is what lets a clip play/seek instead of
 * downloading in full before it can start.
 *
 * A missing row or file is a plain 404 — expected and harmless, since most
 * spells have no matched effect at all (`~/server/library/effectCandidates`)
 * and the canvas already falls back to the plain static shape on a load
 * failure.
 */
export const runtime = 'nodejs';

const RANGE_PATTERN = /bytes=(\d*)-(\d*)/;

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ spellSlug: string }> },
) => {
  const { spellSlug } = await params;

  const effect = await getDb().query.spellEffects.findFirst({
    where: eq(spellEffects.spellSlug, spellSlug),
  });

  if (!effect) {
    return new Response('Not found', { status: 404 });
  }

  const storageRoot = resolve(env.EFFECTS_STORAGE_DIR);
  const absolutePath = resolveWithinStorageRoot(
    storageRoot,
    effect.storagePath,
  );
  const stats = absolutePath
    ? await stat(absolutePath).catch(() => null)
    : null;

  if (!absolutePath || !stats) {
    return new Response('Not found', { status: 404 });
  }

  const range = request.headers.get('range');
  const baseHeaders = {
    'Content-Type': effect.mimeType,
    'Accept-Ranges': 'bytes',
    // Not `immutable`: unlike a map's id, a spell slug can point at a
    // different clip after a future `EFFECT_CANDIDATES` change + re-import,
    // so this URL's content isn't permanently fixed the way the maps file
    // route's is.
    'Cache-Control': 'private, max-age=3600',
  };

  if (!range) {
    return new Response(
      Readable.toWeb(
        createReadStream(absolutePath),
      ) as unknown as ReadableStream,
      { headers: { ...baseHeaders, 'Content-Length': String(stats.size) } },
    );
  }

  const match = RANGE_PATTERN.exec(range);
  const start = match?.[1] ? Number(match[1]) : 0;
  const end = match?.[2] ? Number(match[2]) : stats.size - 1;

  return new Response(
    Readable.toWeb(
      createReadStream(absolutePath, { start, end }),
    ) as unknown as ReadableStream,
    {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Content-Length': String(end - start + 1),
      },
    },
  );
};
