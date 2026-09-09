import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '~/server/db';
import { maps } from '~/server/db/schema';
import { ensureMapSession } from '~/server/maps/session';
import { subscribeToMapsChanges } from '~/server/maps/events';
import { toPlayerMapView } from '~/server/maps/toPlayerMapView';

/**
 * Server-Sent Events: the live feed the player screen reads for the map
 * session — the maps-domain twin of `/api/encounter/stream` (DECISIONS #18).
 *
 * The payload is filtered by `toPlayerMapView` **here, on the server**. The
 * DM's own viewport and fog darkness never reach the browser.
 */
export const dynamic = 'force-dynamic';

/** Proxies and browsers drop a silent connection; a comment line is enough. */
const HEARTBEAT_INTERVAL_MS = 20_000;

export const GET = async (request: Request) => {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start: async controller => {
      let isClosed = false;

      const send = (payload: unknown) => {
        if (isClosed) return;

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      const push = async () => {
        const db = getDb();
        const session = await ensureMapSession(db);
        const activeMap = session.activeMapId
          ? ((await db.query.maps.findFirst({
              where: and(
                eq(maps.id, session.activeMapId),
                isNull(maps.deletedAt),
              ),
            })) ?? null)
          : null;

        send(toPlayerMapView({ session, map: activeMap }));
      };

      await push();

      const unsubscribe = subscribeToMapsChanges(() => {
        void push();
      });

      const heartbeat = setInterval(() => {
        if (isClosed) return;
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, HEARTBEAT_INTERVAL_MS);

      const close = () => {
        if (isClosed) return;

        isClosed = true;
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      };

      request.signal.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
};
