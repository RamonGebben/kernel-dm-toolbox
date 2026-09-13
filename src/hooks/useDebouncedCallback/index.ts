'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * A debounced version of `callback` plus a `cancel` to drop a pending call
 * early — the settle-write cadence shared by the DM's own viewport
 * persistence and the player screen's resize reporting (DECISIONS #26 names
 * this as one of three cadences this app uses). Always fires with the
 * *latest* arguments it was called with, never the first.
 *
 * `callback` itself needn't be memoized by the caller — its latest value is
 * tracked in a ref, so only `delayMs` needs to stay stable across renders
 * for the returned function's identity to stay stable too.
 */
export const useDebouncedCallback = <Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): [(...args: Args) => void, () => void] => {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cancels on unmount — and, since callers typically call `cancel` again
  // from their own effect's cleanup (e.g. before re-observing on a
  // dependency change), this is only the final backstop.
  useEffect(() => cancel, [cancel]);

  const debounced = useCallback(
    (...args: Args) => {
      cancel();
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [cancel, delayMs],
  );

  return [debounced, cancel];
};
