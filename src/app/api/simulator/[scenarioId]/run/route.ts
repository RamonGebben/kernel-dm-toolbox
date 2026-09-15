import { TRPCError } from '@trpc/server';
import { getDb } from '~/server/db';
import { loadScenarioCombatants } from '~/server/simulator/loadScenarioCombatants';
import { runEncounter } from '~/server/simulator/engine/runEncounter';
import type {
  BattleStartCombatant,
  BattleStreamFrame,
} from '~/server/simulator/battleStreamTypes';

/**
 * Server-Sent Events: streams one seeded run of a scenario's fight
 * turn-by-turn (issue #5, milestone 5), matching the encounter tracker's and
 * Maps tool's own SSE precedent (`~/app/api/encounter/stream`,
 * `~/app/api/maps/stream`) rather than a tRPC subscription — this app has no
 * tRPC-native streaming anywhere, so a plain route handler is the
 * established, consistent shape for a realtime feed here.
 *
 * Unlike those two routes, this one has nothing to subscribe to: a run is a
 * single pure `runEncounter` call, computed once, in full, before the first
 * byte goes out. "Streamed" here means the already-computed log is emitted
 * as a sequence of frames with a small per-entry yield, so the client can
 * start rendering the opening rounds while the tail of a long fight is still
 * being written to the wire — genuinely useful for a 50-round Monte-Carlo-
 * scale fight even though the compute itself finishes instantly. Playback
 * pacing (play/pause/step/speed) is entirely a client-side concern layered
 * on top of the buffered frames, independent of how fast they arrived — see
 * `useBattleRunStream`/`usePlaybackClock`.
 */
export const dynamic = 'force-dynamic';

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ scenarioId: string }> },
) => {
  const { scenarioId } = await params;
  const seedParam = new URL(request.url).searchParams.get('seed');
  const parsedSeed = seedParam === null ? null : Number(seedParam);
  const seed =
    parsedSeed !== null &&
    Number.isInteger(parsedSeed) &&
    parsedSeed >= 0 &&
    parsedSeed <= 2 ** 31 - 1
      ? parsedSeed
      : Math.floor(Math.random() * 2 ** 31);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start: async controller => {
      let isClosed = false;

      const send = (frame: BattleStreamFrame) => {
        if (isClosed) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(frame)}\n\n`),
        );
      };

      const close = () => {
        if (isClosed) return;
        isClosed = true;
        controller.close();
      };

      request.signal.addEventListener('abort', close);

      // Loading the scenario and running the encounter can both throw (e.g.
      // the scenario was deleted between the client opening this connection
      // and the request landing) — caught here so the failure reaches the
      // client as a proper `error` frame (per `battleStreamTypes.ts`,
      // consumed by `useBattleRunStream`) instead of an unhandled rejection
      // that just errors the stream at the transport level with no message.
      try {
        const combatants = await loadScenarioCombatants(getDb(), scenarioId);

        const hasParty = combatants.some(c => c.side === 'party');
        const hasMonsters = combatants.some(c => c.side === 'monsters');

        if (!hasParty || !hasMonsters) {
          send({
            kind: 'error',
            message:
              'This scenario needs at least one party member and one monster before it can run.',
          });
          close();
          return;
        }

        const result = runEncounter({ combatants }, seed);

        const startCombatants: BattleStartCombatant[] = combatants.map(c => ({
          id: c.id,
          name: c.name,
          side: c.side,
          position: c.position,
          maxHitPoints: c.maxHitPoints,
        }));

        send({ kind: 'start', seed, combatants: startCombatants });

        for (const entry of result.log) {
          if (isClosed) break;
          send({ kind: 'entry', entry });
          // Yields back to the event loop between frames so a long log goes
          // out as a real sequence of chunks, not one synchronous burst.
          await Promise.resolve();
        }

        send({
          kind: 'complete',
          winner: result.winner,
          rounds: result.rounds,
          combatants: result.combatants,
        });
      } catch (error) {
        send({
          kind: 'error',
          message:
            error instanceof TRPCError
              ? error.message
              : 'Something went wrong running this encounter.',
        });
      } finally {
        close();
      }
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
