import { getDb } from '~/server/db';
import { readEncounterState } from '~/server/encounter/state';
import { subscribeToEncounterChanges } from '~/server/encounter/events';
import { toPlayerView } from '~/server/encounter/toPlayerView';

/**
 * Server-Sent Events: the live feed the player screen reads.
 *
 * One direction only — the server pushes, the client never sends — which is
 * exactly what SSE is for and why this is not a WebSocket (DECISIONS #18).
 *
 * The payload is filtered by `toPlayerView` **here, on the server**. A hidden
 * combatant must never reach the browser at all; filtering in the component
 * would put an ambush one devtools panel away from being spoiled.
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
        const state = await readEncounterState(getDb());
        send(toPlayerView(state));
      };

      await push();

      const unsubscribe = subscribeToEncounterChanges(() => {
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
