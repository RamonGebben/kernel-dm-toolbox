'use client';

import { useEffect, useState } from 'react';
import type { TurnLogEntry, EngineSide } from '~/server/simulator/engine/types';
import type {
  BattleStartCombatant,
  BattleStreamFrame,
} from '~/server/simulator/battleStreamTypes';

export type BattleRunState =
  | { status: 'idle' }
  | { status: 'connecting' }
  | {
      status: 'streaming' | 'complete';
      seed: number;
      combatants: BattleStartCombatant[];
      entries: TurnLogEntry[];
      winner: EngineSide | 'draw' | null;
      rounds: number | null;
    }
  | { status: 'error'; message: string };

type CompleteInfo = { winner: EngineSide | 'draw'; rounds: number };

/**
 * Owns the SSE connection to `GET /api/simulator/[scenarioId]/run`,
 * accumulating frames into one growing `entries` array as they arrive. This
 * is a data channel, not a change notification (unlike `useEncounterStream`)
 * — the payload the component renders IS what this hook collects, the same
 * "frame is the data" spirit as `useEventSourceView`, just accumulating
 * instead of replacing.
 *
 * `startRun()` opens a fresh connection with a newly generated seed —
 * calling it again mid-run (or after completion) discards the previous
 * connection and starts over, letting a DM re-roll the same scenario as many
 * times as they like.
 *
 * Internally tracked as separate pieces (`startFrame`/`entries`/
 * `completeFrame`/`errorMessage`) rather than one `BattleRunState` object,
 * so the exposed `state` can be *derived* by computation instead of set via
 * an explicit "connecting" `setState` call with no real subscription behind
 * it — the latter is exactly what `react-hooks/set-state-in-effect` flags as
 * an anti-pattern (an effect that does nothing but synchronously call
 * `setState`, unrelated to the external system it's meant to synchronize
 * with).
 */
export const useBattleRunStream = (scenarioId: string | null) => {
  const [runSeed, setRunSeed] = useState<number | null>(null);

  const [trackedRunSeed, setTrackedRunSeed] = useState(runSeed);
  const [startFrame, setStartFrame] = useState<{
    seed: number;
    combatants: BattleStartCombatant[];
  } | null>(null);
  const [entries, setEntries] = useState<TurnLogEntry[]>([]);
  const [completeInfo, setCompleteInfo] = useState<CompleteInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset every accumulated piece the moment a new run starts — the same
  // render-time "adjusting state" pattern `usePlaybackClock` uses for its
  // own `resetKey`.
  if (runSeed !== trackedRunSeed) {
    setTrackedRunSeed(runSeed);
    setStartFrame(null);
    setEntries([]);
    setCompleteInfo(null);
    setErrorMessage(null);
  }

  useEffect(() => {
    if (!scenarioId || runSeed === null) return;

    const source = new EventSource(
      `/api/simulator/${scenarioId}/run?seed=${runSeed}`,
    );

    const handleMessage = (event: MessageEvent<string>) => {
      let frame: BattleStreamFrame;
      try {
        frame = JSON.parse(event.data) as BattleStreamFrame;
      } catch {
        return;
      }

      switch (frame.kind) {
        case 'start':
          setStartFrame({ seed: frame.seed, combatants: frame.combatants });
          return;

        case 'entry':
          setEntries(current => [...current, frame.entry]);
          return;

        case 'complete':
          setCompleteInfo({ winner: frame.winner, rounds: frame.rounds });
          source.close();
          return;

        case 'error':
          setErrorMessage(frame.message);
          source.close();
          return;

        default: {
          const exhaustive: never = frame;
          void exhaustive;
        }
      }
    };

    source.addEventListener('message', handleMessage);
    // A genuine connection failure (refused, dropped mid-stream) — our own
    // `error` frame above already closes the connection before this native
    // event would ever fire for it, so this only catches transport-level
    // failures, not an in-band "the scenario can't run" error.
    source.addEventListener('error', () => {
      setErrorMessage('Lost connection to the server.');
      source.close();
    });

    return () => {
      source.close();
    };
  }, [scenarioId, runSeed]);

  const state: BattleRunState =
    runSeed === null
      ? { status: 'idle' }
      : errorMessage !== null
        ? { status: 'error', message: errorMessage }
        : startFrame === null
          ? { status: 'connecting' }
          : {
              status: completeInfo ? 'complete' : 'streaming',
              seed: startFrame.seed,
              combatants: startFrame.combatants,
              entries,
              winner: completeInfo?.winner ?? null,
              rounds: completeInfo?.rounds ?? null,
            };

  return {
    state,
    /** Identifies which run is in flight, set synchronously the moment
     * `startRun` is called — before the connection even opens. Exists so a
     * consumer (`usePlaybackClock`, via `useBattleViewer`) can reset its own
     * playback position immediately on "Roll again", rather than waiting on
     * `state.seed`, which only exists once the `start` frame has arrived. */
    runSeed,
    startRun: () => setRunSeed(Math.floor(Math.random() * 2 ** 31)),
  };
};
