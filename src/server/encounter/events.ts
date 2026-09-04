import { EventEmitter } from 'node:events';

/**
 * In-process notification that the encounter changed.
 *
 * The player view is a live read model (DECISIONS #18), and this is what tells
 * it to refetch. An emitter is enough precisely because of the one-container-
 * per-campaign decision: there is a single Node process, so there is nothing
 * to coordinate between. If this ever runs multiple processes, this is the
 * seam that has to become a real channel — nothing else changes.
 */
const emitter = new EventEmitter();

/** The DM screen can hold several tabs open; none of them should be dropped. */
emitter.setMaxListeners(50);

const ENCOUNTER_CHANGED = 'encounter:changed';

export const publishEncounterChanged = (): void => {
  emitter.emit(ENCOUNTER_CHANGED);
};

/** Returns the unsubscribe function, so a closed stream cannot leak a listener. */
export const subscribeToEncounterChanges = (
  listener: () => void,
): (() => void) => {
  emitter.on(ENCOUNTER_CHANGED, listener);

  return () => {
    emitter.off(ENCOUNTER_CHANGED, listener);
  };
};
