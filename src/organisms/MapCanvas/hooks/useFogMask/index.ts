'use client';

import { useEffect, useRef, type RefObject } from 'react';
import {
  compositeOperationForMode,
  innerRadiusForStroke,
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
 * resolution, rebuilt from committed strokes whenever the fog state or map
 * size changes, drawn onto the main canvas with `globalCompositeOperation`
 * doing the reveal/cover work.
 *
 * Strokes still in progress (before the gesture's batched write commits) are
 * painted directly via `paintStroke`, so the brush feels live rather than
 * waiting on a round trip.
 */
export const useFogMask = ({
  fog,
  mapWidth,
  mapHeight,
  onScheduleDraw,
}: {
  fog: MapCanvasFogState | undefined;
  mapWidth: number;
  mapHeight: number;
  onScheduleDraw: () => void;
}): FogMaskHandle => {
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const maskCtxRef = useRef<CanvasRenderingContext2D | null>(null);

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

    ctx.clearRect(0, 0, mapWidth, mapHeight);
    if (fog.baseState === 'covered') {
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, mapWidth, mapHeight);
    }

    for (const stroke of fog.strokes) drawFogStroke(ctx, stroke);

    onScheduleDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fog, mapWidth, mapHeight]);

  const paintStroke = (stroke: MapCanvasFogStroke) => {
    const ctx = maskCtxRef.current;
    if (ctx) drawFogStroke(ctx, stroke);
  };

  return { maskRef, paintStroke };
};
