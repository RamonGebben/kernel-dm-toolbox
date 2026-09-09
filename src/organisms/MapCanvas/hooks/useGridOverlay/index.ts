'use client';

import { useCallback } from 'react';
import { computeGridLineRange } from '~/utils/mapGrid';
import type { Viewport } from '~/utils/mapViewport';
import type { MapCanvasGridSettings } from '~/organisms/MapCanvas/components/MapCanvasView';

/**
 * Below this on-screen spacing, individual grid lines are aliasing noise
 * rather than information — skip drawing them entirely. This also caps the
 * worst case for the loop below: line count grows as the user zooms out
 * (on-screen cell size shrinks), so culling exactly when it's small also
 * culls exactly when it would otherwise explode into hundreds of lines.
 */
const MIN_ON_SCREEN_CELL_PX = 3;

/**
 * Draws the grid overlay for the current viewport. The line-placement math
 * lives in `~/utils/mapGrid` and is tested there; this is just the canvas
 * calls, which cannot be unit-tested without a real 2D context.
 *
 * Every line is one `moveTo`/`lineTo` pair on a single shared path, stroked
 * once — not a `beginPath`/`stroke` pair per line, which is what made a
 * zoomed-out view (many visible lines) issue hundreds of native draw calls
 * into a single frame.
 */
export const useGridOverlay = () =>
  useCallback(
    (
      ctx: CanvasRenderingContext2D,
      viewport: Viewport,
      canvasWidth: number,
      canvasHeight: number,
      grid: MapCanvasGridSettings,
    ) => {
      const onScreenCellSize = grid.cellSize * (viewport.zoom || 1);
      if (onScreenCellSize < MIN_ON_SCREEN_CELL_PX) return;

      const range = computeGridLineRange({
        viewport,
        canvasWidth,
        canvasHeight,
        cellSize: grid.cellSize,
        originX: grid.originX,
        originY: grid.originY,
      });

      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = grid.color;
      ctx.globalAlpha = grid.opacity;

      ctx.beginPath();
      for (let x = range.startX; x <= range.maxX; x += range.cellSize) {
        ctx.moveTo(x, range.minY);
        ctx.lineTo(x, range.maxY);
      }
      for (let y = range.startY; y <= range.maxY; y += range.cellSize) {
        ctx.moveTo(range.minX, y);
        ctx.lineTo(range.maxX, y);
      }
      ctx.stroke();

      ctx.restore();
    },
    [],
  );
