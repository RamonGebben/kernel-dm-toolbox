'use client';

import { useCallback, useEffect, useRef } from 'react';

export type SpellEffectVideoEntry = {
  video: HTMLVideoElement;
  failed: boolean;
};

/**
 * A small pool of `<video>` elements for animated spell-effect clips, keyed
 * by URL — unlike the map's own media (`useMapMedia`, always exactly one
 * active image/video), several placed shapes can have effects playing at
 * once, so this is a cache, not a single slot.
 *
 * Elements are muted (autoplay requires it) and never looped — a clip plays
 * once, the way the source library's clips are authored to be used as VTT
 * overlay sprites, not background loops.
 *
 * Playback position is never driven by this hook: each element free-runs on
 * its own `<video>` clock from the moment it's created (whenever this
 * client's canvas first asks for that URL), so the DM's and player's
 * independently-created elements for the same clip start at different real
 * times and are never frame-synced. `MapCanvasView` computes *whether* a
 * shape's effect is still playing from this element's own `ended` state
 * (`~/utils/mapMeasurement`'s `isEffectPlaying`) rather than from
 * `effectStartedAtMs` directly — that server timestamp only bounds *how
 * long a client will keep trying* (`MAX_EFFECT_WAIT_MS`), since comparing it
 * to a short clip's real duration would race the very network+render
 * latency that makes this element's creation time unpredictable in the
 * first place.
 */
export const useSpellEffectVideoCache = (onReady: () => void) => {
  const cacheRef = useRef(new Map<string, SpellEffectVideoEntry>());
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(
    () => () => {
      for (const entry of cacheRef.current.values()) {
        entry.video.pause();
        entry.video.removeAttribute('src');
        entry.video.load();
      }
      cacheRef.current.clear();
    },
    [],
  );

  /** The cached entry for a URL, lazily creating and starting it on first
   * ask. Callers re-ask every frame a shape's effect might still be playing
   * — cheap, since this only does real work the first time a URL is seen. */
  const getVideo = useCallback((url: string): SpellEffectVideoEntry => {
    const cache = cacheRef.current;
    const existing = cache.get(url);
    if (existing) return existing;

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = url;

    const entry: SpellEffectVideoEntry = {
      video,
      failed: false,
    };
    cache.set(url, entry);

    video.addEventListener('loadedmetadata', () => {
      onReadyRef.current();
    });
    video.addEventListener('canplay', () => {
      // A muted autoplay can still reject (e.g. a backgrounded tab); a
      // stalled clip just never becomes "ready to draw" and the shape's own
      // `MAX_EFFECT_WAIT_MS` fallback moves on.
      void video.play().catch(() => {});
    });
    video.addEventListener('error', () => {
      entry.failed = true;
      onReadyRef.current();
    });

    return entry;
  }, []);

  return { getVideo };
};
