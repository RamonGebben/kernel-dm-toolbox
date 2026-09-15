'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import type { PlaybackSpeed } from '~/organisms/BattleViewer/hooks/usePlaybackClock';

export type PlaybackControlsProps = {
  isPlaying: boolean;
  isFinished: boolean;
  speed: PlaybackSpeed;
  revealedCount: number;
  totalEntries: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
};

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 1, 2, 4];

/** Presentational: play/pause, single-step, and a speed multiplier — every
 * control a `usePlaybackClock` consumer needs, none of it aware of the SSE
 * connection or the log itself. */
export const PlaybackControls = ({
  isPlaying,
  isFinished,
  speed,
  revealedCount,
  totalEntries,
  onPlay,
  onPause,
  onStep,
  onSpeedChange,
}: PlaybackControlsProps) => (
  <Wrapper>
    <Button
      variant="secondary"
      size="sm"
      onClick={isPlaying ? onPause : onPlay}
    >
      {isPlaying ? 'Pause' : isFinished ? 'Replay' : 'Play'}
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={onStep}
      disabled={isPlaying || revealedCount >= totalEntries}
    >
      Step
    </Button>
    <SpeedGroup role="group" aria-label="Playback speed">
      {SPEED_OPTIONS.map(option => (
        <SpeedButton
          key={option}
          type="button"
          $isActive={option === speed}
          aria-pressed={option === speed}
          onClick={() => onSpeedChange(option)}
        >
          {option}x
        </SpeedButton>
      ))}
    </SpeedGroup>
    <Progress>
      {revealedCount} / {totalEntries}
    </Progress>
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${props => props.theme.space.sm};
`;

const SpeedGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.space.xs};
`;

const SpeedButton = styled.button<{ $isActive: boolean }>`
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  background: ${props =>
    props.$isActive ? props.theme.color.accent : 'transparent'};
  border: 1px solid
    ${props =>
      props.$isActive ? props.theme.color.accent : props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props =>
    props.$isActive
      ? props.theme.color.textInverted
      : props.theme.color.textMuted};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.sm};
  cursor: pointer;
`;

const Progress = styled.span`
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;
