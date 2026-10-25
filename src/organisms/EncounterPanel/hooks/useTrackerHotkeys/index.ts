'use client';

import { useEffect, useRef } from 'react';

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Whether a keydown should be treated as a hotkey rather than typed text —
 * not modified (so browser/OS shortcuts still work), and not landing in a
 * focused form field (the HP amount, condition rounds, a dialog's inputs).
 */
export const isHotkeyEvent = (
  event: Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey' | 'target'>,
): boolean => {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;

  const target = event.target as HTMLElement | null;
  if (target?.isContentEditable) return false;
  if (target && EDITABLE_TAGS.has(target.tagName)) return false;

  return true;
};

export interface TrackerHotkeysOptions {
  /** Only wired up once a fight is running — before that, "next" has no
   * meaning yet and the DM is still assembling the order. */
  enabled: boolean;
  onNextTurn: () => void;
}

/**
 * `n` advances the turn from anywhere on the tracker page.
 *
 * The callback is read from a ref rather than a `useEffect` dependency so the
 * listener is attached once per `enabled` toggle, not re-attached on every
 * render just because `onNextTurn` is a fresh closure.
 */
export const useTrackerHotkeys = ({
  enabled,
  onNextTurn,
}: TrackerHotkeysOptions): void => {
  const onNextTurnRef = useRef(onNextTurn);
  useEffect(() => {
    onNextTurnRef.current = onNextTurn;
  }, [onNextTurn]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isHotkeyEvent(event)) return;
      if (event.key.toLowerCase() !== 'n') return;

      event.preventDefault();
      onNextTurnRef.current();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
};
