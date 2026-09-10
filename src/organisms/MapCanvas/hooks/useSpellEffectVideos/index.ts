'use client';

import { useCallback, useEffect, useRef } from 'react';

export type SpellEffectVideoEntry = {
  video: HTMLVideoElement;
  failed: boolean;
};

/**
 * A small pool of `<video>` elements for animated spell-effect clips, keyed
 * by **shape id**, not clip URL — several placed shapes can share the same
 * spell (two Fireballs), and each needs its own independently-playing
 * element; keying by URL would make the second placement silently reuse (and
 * so desync from, or just read the already-`ended` state of) the first
 * shape's video instead of starting its own.
 *
 * An instantaneous spell's element is muted (autoplay requires it) and never
 * looped — a clip plays once, the way the source library's clips are
 * authored to be used as VTT overlay sprites. An ongoing-duration spell's
 * element (`loop: true`, from `shouldLoopSpellEffect`) repeats natively via
 * the browser's own `loop` property for as long as its cache entry lives —
 * no extra timer/interval needed here.
 *
 * Playback position is never driven by this hook: each element free-runs on
 * its own `<video>` clock from the moment it's created (whenever this
 * client's canvas first asks for that shape). `MapCanvasView` computes
 * *whether* a one-shot shape's effect is still playing from this element's
 * own `ended` state (`~/utils/mapMeasurement`'s `isEffectPlaying`) rather
 * than from `effectStartedAtMs` directly — that server timestamp only bounds
 * *how long a client will keep trying* (`MAX_EFFECT_WAIT_MS`), since
 * comparing it to a short clip's real duration would race the very
 * network+render latency that makes this element's creation time
 * unpredictable in the first place. A looping shape skips that check
 * entirely (see `MapCanvasView`): the clip just keeps playing until its
 * entry is pruned.
 *
 * Entries are never evicted on their own — `pruneVideos` must be called with
 * the currently-live shape ids (e.g. whenever the shape list changes) so a
 * removed shape's element actually stops, instead of decoding forever in the
 * background once nothing on the board still references its URL.
 */
export const useSpellEffectVideoCache = (onReady: () => void) => {
  const cacheRef = useRef(new Map<string, SpellEffectVideoEntry>());
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const stopAndDiscard = (entry: SpellEffectVideoEntry) => {
    entry.video.pause();
    entry.video.removeAttribute('src');
    entry.video.load();
  };

  useEffect(
    () => () => {
      for (const entry of cacheRef.current.values()) stopAndDiscard(entry);
      cacheRef.current.clear();
    },
    [],
  );

  /** The cached entry for a shape, lazily creating and starting it on first
   * ask. Callers re-ask every frame a shape's effect might still be playing
   * — cheap, since this only does real work the first time a shape id is
   * seen; `url`/`loop` are only read on that first call. */
  const getVideo = useCallback(
    (shapeId: string, url: string, loop: boolean): SpellEffectVideoEntry => {
      const cache = cacheRef.current;
      const existing = cache.get(shapeId);
      if (existing) return existing;

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.loop = loop;
      video.src = url;

      const entry: SpellEffectVideoEntry = {
        video,
        failed: false,
      };
      cache.set(shapeId, entry);

      video.addEventListener('loadedmetadata', () => {
        onReadyRef.current();
      });
      video.addEventListener('canplay', () => {
        // A muted autoplay can still reject (e.g. a backgrounded tab); a
        // stalled clip just never becomes "ready to draw" and the shape's
        // own `MAX_EFFECT_WAIT_MS` fallback moves on.
        void video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        entry.failed = true;
        onReadyRef.current();
      });

      return entry;
    },
    [],
  );

  /** Stops and discards every cached element whose shape id is no longer
   * live — called whenever the placed-shapes list changes, so a removed
   * shape's clip (looping or not) actually stops instead of continuing to
   * decode/play off-screen forever. */
  const pruneVideos = useCallback((activeShapeIds: ReadonlySet<string>) => {
    const cache = cacheRef.current;
    for (const [shapeId, entry] of cache) {
      if (activeShapeIds.has(shapeId)) continue;
      stopAndDiscard(entry);
      cache.delete(shapeId);
    }
  }, []);

  return { getVideo, pruneVideos };
};
