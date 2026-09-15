'use client';

import { BattleViewerView } from '~/organisms/BattleViewer/components/BattleViewerView';
import { useBattleViewer } from '~/organisms/BattleViewer/hooks/useBattleViewer';

/** Connected boundary: owns the scenario-detail query and the SSE run
 * stream, renders nothing itself (issue #5, milestone 5). */
export const BattleViewer = () => {
  const battle = useBattleViewer();

  return (
    <BattleViewerView
      hasScenario={battle.hasScenario}
      canRun={battle.canRun}
      runState={battle.runState}
      revealedCount={battle.revealedCount}
      isPlaying={battle.isPlaying}
      isFinished={battle.isFinished}
      speed={battle.speed}
      onStartRun={battle.onStartRun}
      onPlay={battle.onPlay}
      onPause={battle.onPause}
      onStep={battle.onStep}
      onSpeedChange={battle.onSpeedChange}
    />
  );
};
