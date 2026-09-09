import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { and, eq, isNull } from 'drizzle-orm';
import { env } from '~/env';
import { getDb } from '~/server/db';
import { maps } from '~/server/db/schema';
import { resolveWithinStorageRoot } from '~/utils/mapStorage';

/**
 * Serves an uploaded map's bytes, looked up by DB id — never by a
 * client-supplied filesystem path. Range support is what lets a `.webm` map
 * play/seek instead of needing to download in full before it can start.
 *
 * Both the DM canvas and the player canvas fetch this same URL.
 */
export const runtime = 'nodejs';

const RANGE_PATTERN = /bytes=(\d*)-(\d*)/;

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ mapId: string }> },
) => {
  const { mapId } = await params;

  const map = await getDb().query.maps.findFirst({
    where: and(eq(maps.id, mapId), isNull(maps.deletedAt)),
  });

  if (!map) {
    return new Response('Not found', { status: 404 });
  }

  const storageRoot = resolve(env.MAPS_STORAGE_DIR);
  const absolutePath = resolveWithinStorageRoot(storageRoot, map.storagePath);
  const stats = absolutePath
    ? await stat(absolutePath).catch(() => null)
    : null;

  if (!absolutePath || !stats) {
    return new Response('Not found', { status: 404 });
  }

  const range = request.headers.get('range');
  const baseHeaders = {
    'Content-Type': map.mimeType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=31536000, immutable',
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
