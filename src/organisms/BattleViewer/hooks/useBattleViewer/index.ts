'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useScenarioSelectionStore } from '~/stores/scenarioSelection';
import { useBattleRunStream } from '~/organisms/BattleViewer/hooks/useBattleRunStream';
import { usePlaybackClock } from '~/organisms/BattleViewer/hooks/usePlaybackClock';

/**
 * Assembles everything `BattleViewerView` needs: the selected scenario's
 * party/monster counts (to gate the "Run" control the same way the SSE
 * route itself gates a run), the SSE run stream, and playback state.
 * `trpc.simulator.get` is the same query `useScenarioBuilder` already reads
 * for the Build tab — TanStack Query dedupes it, so both tabs share one
 * cached fetch rather than issuing two.
 */
export const useBattleViewer = () => {
  const trpc = useTRPC();
  const selectedScenarioId = useScenarioSelectionStore(
    state => state.selectedScenarioId,
  );

  const detail = useQuery({
    ...trpc.simulator.get.queryOptions({ id: selectedScenarioId ?? '' }),
    enabled: selectedScenarioId !== null,
  });

  const {
    state: runState,
    runSeed,
    startRun,
  } = useBattleRunStream(selectedScenarioId);

  const totalEntries =
    runState.status === 'streaming' || runState.status === 'complete'
      ? runState.entries.length
      : 0;

  const clock = usePlaybackClock(totalEntries, runSeed);

  const canRun =
    (detail.data?.party.length ?? 0) > 0 &&
    (detail.data?.monsters.length ?? 0) > 0;

  return {
    hasScenario: selectedScenarioId !== null,
    canRun,
    runState,
    revealedCount: clock.revealedCount,
    isPlaying: clock.isPlaying,
    isFinished: clock.isFinished,
    speed: clock.speed,
    onStartRun: startRun,
    onPlay: clock.play,
    onPause: clock.pause,
    onStep: clock.step,
    onSpeedChange: clock.setSpeed,
  };
};
