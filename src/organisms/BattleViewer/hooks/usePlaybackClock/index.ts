'use client';

import { useEffect, useRef, useState } from 'react';

export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

/** Real time, at 1x speed, one revealed log entry stays on screen before the
 * next one reveals — tuned for "readable, not sluggish". */
const BASE_MS_PER_ENTRY = 600;

/**
 * How many of `totalEntries` should be revealed after `elapsedMs` of
 * playback at `speed`, clamped to the actual entry count. Pure — the RAF
 * loop below is the only impure part of this module, and it's a thin
 * wrapper around this calculation.
 */
export const computeRevealedCount = (
  totalEntries: number,
  elapsedMs: number,
  speed: PlaybackSpeed,
): number => {
  if (totalEntries <= 0) return 0;
  const revealed = Math.floor((elapsedMs * speed) / BASE_MS_PER_ENTRY);
  return Math.max(0, Math.min(totalEntries, revealed));
};

export type UsePlaybackClockResult = {
  revealedCount: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  isFinished: boolean;
  play: () => void;
  pause: () => void;
  step: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
};

/**
 * Drives which prefix of a battle's turn log is "revealed" right now.
 * Play/pause/speed are real playback controls; `step` advances exactly one
 * entry regardless of play state. Ticks via `requestAnimationFrame`,
 * matching this app's RAF-gated canvas discipline elsewhere (`MapCanvasView`,
 * `PlacementGrid`) rather than a `setInterval`.
 *
 * `totalEntries` growing while playing (frames still arriving from the SSE
 * stream) is handled for free — `computeRevealedCount` just clamps to
 * whatever the current total is.
 *
 * `resetKey` identifies which run is being played back (`useBattleViewer`
 * passes `useBattleRunStream`'s `runSeed`). Changing it snaps elapsed time
 * and revealed count back to zero immediately — without it, clicking "Roll
 * again" mid-playback would carry the previous run's accumulated elapsed
 * time into the new one and reveal it far ahead of where it should start.
 */
export const usePlaybackClock = (
  totalEntries: number,
  resetKey?: unknown,
): UsePlaybackClockResult => {
  const [revealedCount, setRevealedCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1);

  const elapsedMsRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  /** The React-docs "adjusting state when a prop changes" pattern: comparing
   * against a tracked copy of `resetKey` and calling `setState` directly
   * during render, rather than in an effect — an effect that does nothing
   * but call `setState` with no external system involved is exactly the
   * `react-hooks/set-state-in-effect` anti-pattern. */
  const [trackedResetKey, setTrackedResetKey] = useState(resetKey);
  if (resetKey !== trackedResetKey) {
    setTrackedResetKey(resetKey);
    setRevealedCount(0);
    setIsPlaying(false);
  }

  /** The two clock refs reset alongside `resetKey` too, but as a plain
   * effect — ref writes inside an effect are the standard, unflagged
   * pattern (`react-hooks/refs` only objects to writing refs *during*
   * render, which the block above deliberately avoids by using state). */
  useEffect(() => {
    elapsedMsRef.current = 0;
    lastFrameTimeRef.current = null;
  }, [resetKey]);

  useEffect(() => {
    if (!isPlaying) {
      lastFrameTimeRef.current = null;
      return;
    }

    let frameId: number;

    const tick = (now: number) => {
      const last = lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      if (last !== null) {
        elapsedMsRef.current += now - last;
      }

      const next = computeRevealedCount(
        totalEntries,
        elapsedMsRef.current,
        speedRef.current,
      );

      setRevealedCount(current => (current === next ? current : next));

      if (next >= totalEntries) {
        setIsPlaying(false);
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, totalEntries]);

  return {
    revealedCount,
    isPlaying,
    speed,
    isFinished: totalEntries > 0 && revealedCount >= totalEntries,
    play: () => {
      if (totalEntries > 0 && revealedCount >= totalEntries) {
        elapsedMsRef.current = 0;
        setRevealedCount(0);
      }
      setIsPlaying(true);
    },
    pause: () => setIsPlaying(false),
    step: () => {
      setIsPlaying(false);
      setRevealedCount(current => {
        const next = Math.min(totalEntries, current + 1);
        elapsedMsRef.current = (next * BASE_MS_PER_ENTRY) / speedRef.current;
        return next;
      });
    },
    setSpeed: nextSpeed => setSpeedState(nextSpeed),
  };
};
