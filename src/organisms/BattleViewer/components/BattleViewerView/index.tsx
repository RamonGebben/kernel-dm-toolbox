'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { BattleCanvas } from '~/organisms/BattleViewer/components/BattleViewerView/components/BattleCanvas';
import { PlaybackControls } from '~/organisms/BattleViewer/components/BattleViewerView/components/PlaybackControls';
import type { BattleRunState } from '~/organisms/BattleViewer/hooks/useBattleRunStream';
import type { PlaybackSpeed } from '~/organisms/BattleViewer/hooks/usePlaybackClock';
import { deriveBattleSnapshot } from '~/utils/deriveBattleSnapshot';
import { formatBattleLogEntry } from '~/utils/formatBattleLogEntry';
import { highlightedCombatantIdsForEntry } from '~/utils/highlightedCombatantIdsForEntry';
import type { EngineSide } from '~/server/simulator/engine/types';

export type BattleViewerViewProps = {
  hasScenario: boolean;
  /** A scenario needs at least one party member and one monster before it
   * can run — mirrors the same guard the SSE route itself enforces. */
  canRun: boolean;
  runState: BattleRunState;
  revealedCount: number;
  isPlaying: boolean;
  isFinished: boolean;
  speed: PlaybackSpeed;
  onStartRun: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
};

const winnerLabel = (winner: EngineSide | 'draw'): string =>
  winner === 'party'
    ? 'The party wins!'
    : winner === 'monsters'
      ? 'The monsters win!'
      : "It's a draw.";

/**
 * Presentational: a scenario's animated battle viewer (issue #5, milestone
 * 5) — a "Run" control, the battle grid, playback controls, and a readable
 * turn log. Owns no query/stream of its own; every state (idle, connecting,
 * streaming, complete, error) arrives as a prop from `BattleViewer`, the
 * connected boundary.
 */
export const BattleViewerView = ({
  hasScenario,
  canRun,
  runState,
  revealedCount,
  isPlaying,
  isFinished,
  speed,
  onStartRun,
  onPlay,
  onPause,
  onStep,
  onSpeedChange,
}: BattleViewerViewProps) => {
  if (!hasScenario) {
    return (
      <EmptyState
        title="No scenario selected"
        description="Create a scenario or pick one from the list to run a battle."
      />
    );
  }

  if (!canRun) {
    return (
      <EmptyState
        title="Not ready to run"
        description="Add at least one party member and one monster on the Build tab before running a battle."
      />
    );
  }

  if (runState.status === 'idle') {
    return (
      <IdleWrapper>
        <EmptyState
          title="Ready to run"
          description="Roll a fresh seed and watch the fight play out on the grid."
          detail={
            <Button onClick={onStartRun} size="sm">
              Run battle
            </Button>
          }
        />
      </IdleWrapper>
    );
  }

  if (runState.status === 'connecting') {
    return <Skeleton role="status" aria-label="Starting the battle" />;
  }

  if (runState.status === 'error') {
    return (
      <IdleWrapper>
        <EmptyState
          title="Couldn't run this battle"
          description={runState.message}
          detail={
            <Button onClick={onStartRun} size="sm">
              Try again
            </Button>
          }
        />
      </IdleWrapper>
    );
  }

  const revealedEntries = runState.entries.slice(0, revealedCount);
  const snapshot = deriveBattleSnapshot(runState.combatants, revealedEntries);
  const namesById = new Map(
    runState.combatants.map(combatant => [combatant.id, combatant.name]),
  );
  const lastEntry = revealedEntries.at(-1) ?? null;
  const highlightedCombatantIds = highlightedCombatantIdsForEntry(lastEntry);

  return (
    <Wrapper>
      <TopBar>
        <Button variant="ghost" size="sm" onClick={onStartRun}>
          Roll again
        </Button>
        <Seed>Seed {runState.seed}</Seed>
        {runState.status === 'complete' && runState.winner && (
          <Winner>{winnerLabel(runState.winner)}</Winner>
        )}
      </TopBar>

      <Content>
        <CanvasColumn>
          <BattleCanvas
            combatants={snapshot}
            highlightedCombatantIds={highlightedCombatantIds}
          />
          <PlaybackControls
            isPlaying={isPlaying}
            isFinished={isFinished}
            speed={speed}
            revealedCount={revealedCount}
            totalEntries={runState.entries.length}
            onPlay={onPlay}
            onPause={onPause}
            onStep={onStep}
            onSpeedChange={onSpeedChange}
          />
        </CanvasColumn>

        <LogColumn aria-label="Turn log" role="log">
          {revealedEntries.map((entry, index) => (
            // Index as key: a strictly append-only, never-reordered list
            // rebuilt from the same `runState.entries` prefix every render.
            <LogLine key={index}>
              {formatBattleLogEntry(entry, namesById)}
            </LogLine>
          ))}
          {!revealedEntries.length && (
            <Muted>The fight hasn&rsquo;t started yet.</Muted>
          )}
        </LogColumn>
      </Content>
    </Wrapper>
  );
};

const IdleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  height: 100%;
  min-height: 0;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
`;

const Seed = styled.span`
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;

const Winner = styled.strong`
  margin-left: auto;
  color: ${props => props.theme.color.textPrimary};
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  gap: ${props => props.theme.space.md};
  flex-wrap: wrap;
`;

const CanvasColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const LogColumn = styled.div`
  flex: 1;
  min-width: 14rem;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const LogLine = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textPrimary};
  font-size: ${props => props.theme.fontSize.sm};
`;

const Muted = styled.span`
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;

const Skeleton = styled.div`
  height: 16rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
