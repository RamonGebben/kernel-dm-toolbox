'use client';

import { useEffect, useRef, type RefObject } from 'react';
import {
  compositeOperationForMode,
  innerRadiusForStroke,
  shouldCompactFog,
} from '~/utils/fogMask';
import type {
  MapCanvasFogState,
  MapCanvasFogStroke,
} from '~/organisms/MapCanvas/components/MapCanvasView';

export type FogMaskHandle = {
  maskRef: RefObject<HTMLCanvasElement | null>;
  /** Paints one stroke immediately, for live feedback while a gesture is in progress. */
  paintStroke: (stroke: MapCanvasFogStroke) => void;
};

/** Draws one stroke onto the mask: reveal erases, cover paints, both feathered by softness. */
const drawFogStroke = (
  ctx: CanvasRenderingContext2D,
  stroke: MapCanvasFogStroke,
) => {
  ctx.save();
  ctx.globalCompositeOperation = compositeOperationForMode(stroke.mode);

  if (stroke.shape === 'circle') {
    const innerRadius = innerRadiusForStroke(stroke);
    const gradient = ctx.createRadialGradient(
      stroke.x,
      stroke.y,
      innerRadius,
      stroke.x,
      stroke.y,
      stroke.radius,
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(stroke.x, stroke.y, stroke.radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(
      stroke.x - stroke.radius,
      stroke.y - stroke.radius,
      stroke.radius * 2,
      stroke.radius * 2,
    );
  }

  ctx.restore();
};

/**
 * Owns the offscreen fog mask: an alpha canvas at the map's native
 * resolution, rebuilt whenever the fog state or map size changes, drawn onto
 * the main canvas with `globalCompositeOperation` doing the reveal/cover
 * work.
 *
 * Strokes still in progress (before the gesture's batched write commits) are
 * painted directly via `paintStroke`, so the brush feels live rather than
 * waiting on a round trip.
 *
 * The rebuild draws `baselineImage` (if any) first, then replays only the
 * strokes on top of it — never `baseState`'s full-canvas fill once a
 * baseline exists, since the baseline is itself a snapshot of that fill plus
 * every earlier stroke (see `MapFogState.baselineImage`). The decoded image
 * is cached by its own data URL so a stroke-only change (the common case
 * between compactions) never re-decodes it.
 */
export const useFogMask = ({
  fog,
  mapWidth,
  mapHeight,
  onScheduleDraw,
  onCompactionNeeded,
  isCompactionPending = false,
}: {
  fog: MapCanvasFogState | undefined;
  mapWidth: number;
  mapHeight: number;
  onScheduleDraw: () => void;
  /** Undefined on a non-interactive (player) canvas — see the prop's own
   * comment on `MapCanvasViewProps`. `compactedStrokeCount` is how many
   * leading strokes this exact snapshot baked in, so the server only drops
   * that many rather than trusting the client to say "clear everything". */
  onCompactionNeeded?: (
    baselineImage: string,
    compactedStrokeCount: number,
  ) => void;
  /** True while a previous compaction request is still in flight. Skips the
   * `toDataURL` rasterize itself (not just the mutation call it would feed) —
   * without this, every stroke committed while `strokes.length` stays above
   * the threshold re-encodes the full-resolution mask on the main thread for
   * a result that gets thrown away as soon as it's handed to a caller that's
   * just going to no-op on it. */
  isCompactionPending?: boolean;
}): FogMaskHandle => {
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const maskCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const baselineImageRef = useRef<{
    src: string;
    image: HTMLImageElement;
  } | null>(null);

  const onCompactionNeededRef = useRef(onCompactionNeeded);
  useEffect(() => {
    onCompactionNeededRef.current = onCompactionNeeded;
  }, [onCompactionNeeded]);

  const isCompactionPendingRef = useRef(isCompactionPending);
  useEffect(() => {
    isCompactionPendingRef.current = isCompactionPending;
  }, [isCompactionPending]);

  useEffect(() => {
    if (!fog?.enabled || mapWidth <= 0 || mapHeight <= 0) {
      maskRef.current = null;
      maskCtxRef.current = null;
      onScheduleDraw();
      return;
    }

    let canvas = maskRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      maskRef.current = canvas;
      maskCtxRef.current = canvas.getContext('2d');
    }

    if (canvas.width !== mapWidth || canvas.height !== mapHeight) {
      canvas.width = mapWidth;
      canvas.height = mapHeight;
    }

    const ctx = maskCtxRef.current;
    if (!ctx) return;

    const strokes = fog.strokes;
    const baseState = fog.baseState;

    let cancelled = false;

    const render = (baseImage: HTMLImageElement | null) => {
      ctx.clearRect(0, 0, mapWidth, mapHeight);

      if (baseImage) {
        ctx.drawImage(baseImage, 0, 0, mapWidth, mapHeight);
      } else if (baseState === 'covered') {
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(0, 0, mapWidth, mapHeight);
      }

      for (const stroke of strokes) drawFogStroke(ctx, stroke);

      onScheduleDraw();

      if (
        onCompactionNeededRef.current &&
        !isCompactionPendingRef.current &&
        shouldCompactFog(strokes.length)
      ) {
        // Deferred a tick so the paint `onScheduleDraw` just requested isn't
        // delayed by `toDataURL`'s synchronous full-resolution PNG encode —
        // both run on the main thread, so ordering them after the browser
        // has had a chance to paint keeps this off the critical frame path.
        setTimeout(() => {
          if (cancelled) return;
          onCompactionNeededRef.current?.(
            canvas.toDataURL('image/png'),
            strokes.length,
          );
        }, 0);
      }
    };

    const baselineSrc = fog.baselineImage;
    if (!baselineSrc) {
      baselineImageRef.current = null;
      render(null);
      return () => {
        cancelled = true;
      };
    }

    const cached = baselineImageRef.current;
    if (cached && cached.src === baselineSrc) {
      render(cached.image);
      return () => {
        cancelled = true;
      };
    }

    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      baselineImageRef.current = { src: baselineSrc, image };
      render(image);
    };
    image.onerror = () => {
      // A failed decode falls back to strokes-only rather than blocking the
      // mask forever — the same "degrade, don't break" spirit as a missing
      // spell-effect clip elsewhere on this canvas. Logged because this
      // silently drops every stroke baked into the baseline (everything
      // before the last compaction), not just strokes since it.
      if (cancelled) return;
      console.error(
        'useFogMask: failed to decode fog baseline image; rendering strokes without it',
      );
      render(null);
    };
    image.src = baselineSrc;

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fog, mapWidth, mapHeight]);

  const paintStroke = (stroke: MapCanvasFogStroke) => {
    const ctx = maskCtxRef.current;
    if (ctx) drawFogStroke(ctx, stroke);
  };

  return { maskRef, paintStroke };
};
