import { EventEmitter } from 'node:events';

/**
 * In-process notification that the map session changed — the maps-domain
 * equivalent of `~/server/encounter/events`. The player screen is a live read
 * model over SSE (mirroring DECISIONS #18), and this is what tells the DM
 * screen to refetch and the SSE route to push a fresh frame.
 *
 * An emitter is enough for the same reason it is on the encounter side: one
 * container per campaign means one Node process, so there is nothing to
 * coordinate between. If this ever runs multiple processes, this is the seam
 * that has to become a real channel — nothing else changes.
 */
const emitter = new EventEmitter();

/** The DM screen and the player screen can each hold several tabs open. */
emitter.setMaxListeners(50);

const MAPS_CHANGED = 'maps:changed';

export const publishMapsChanged = (): void => {
  emitter.emit(MAPS_CHANGED);
};

/** Returns the unsubscribe function, so a closed stream cannot leak a listener. */
export const subscribeToMapsChanges = (listener: () => void): (() => void) => {
  emitter.on(MAPS_CHANGED, listener);

  return () => {
    emitter.off(MAPS_CHANGED, listener);
  };
};
