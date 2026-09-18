export type CoalescedPusher = {
  /** Ask for a push. Never awaited by the caller — an SSE change listener
   * fires-and-forgets this on every event. */
  requestPush: () => void;
};

/**
 * Wraps an async `push` so that any number of requests arriving while one is
 * already in flight collapse into exactly one more push afterward, rather
 * than each starting its own overlapping call.
 *
 * Without this, an SSE route that calls `push()` directly from a change
 * listener (as `maps:changed`/`encounter:changed` do) launches a fresh
 * `push()` — its own DB reads plus a JSON-serialize-and-enqueue — for every
 * single event, with no bound on how many can be in flight at once. A DM
 * dragging the lens or aiming a measurement broadcasts change events at up to
 * once per animation frame; once events arrive faster than a `push()` can
 * complete (more likely the longer a session runs and the more there is to
 * serialize — see the fog stroke history), the in-flight calls pile up
 * unboundedly and the player screen's lag only grows, never recovers, for
 * the rest of the session.
 *
 * This makes the pusher self-limiting instead: at most one `push()` runs at
 * a time, and a burst of requests during that call is coalesced into a
 * single trailing run once it settles — so the stream is always as current
 * as one `push()`'s latency allows, never behind by an ever-growing queue.
 */
export const createCoalescedPusher = (
  push: () => Promise<void>,
): CoalescedPusher => {
  let isRunning = false;
  let isDirty = false;

  const run = async () => {
    isRunning = true;

    do {
      isDirty = false;
      try {
        await push();
      } catch (error) {
        // A dropped SSE frame is recoverable — the next change re-triggers a
        // push — so this must not become an unhandled rejection that could
        // take the process down.
        console.error('createCoalescedPusher: push failed', error);
      }
    } while (isDirty);

    isRunning = false;
  };

  return {
    requestPush: () => {
      if (isRunning) {
        isDirty = true;
        return;
      }

      void run();
    },
  };
};
