import type { Viewport } from '~/utils/mapViewport';

export type GridLineRange = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  startX: number;
  startY: number;
  cellSize: number;
};

/**
 * The visible range of grid lines for the current viewport, buffered a tile
 * past each edge so panning never reveals a bare edge before the next frame
 * redraws.
 */
export const computeGridLineRange = ({
  viewport,
  canvasWidth,
  canvasHeight,
  cellSize,
  originX,
  originY,
}: {
  viewport: Viewport;
  canvasWidth: number;
  canvasHeight: number;
  cellSize: number;
  originX: number;
  originY: number;
}): GridLineRange => {
  const zoom = viewport.zoom || 1;
  const viewWidth = canvasWidth / zoom;
  const viewHeight = canvasHeight / zoom;
  const size = cellSize || 48;

  const minX = viewport.x - viewWidth;
  const maxX = viewport.x + viewWidth * 2;
  const minY = viewport.y - viewHeight;
  const maxY = viewport.y + viewHeight * 2;

  return {
    minX,
    maxX,
    minY,
    maxY,
    startX: Math.floor((minX - originX) / size) * size + originX,
    startY: Math.floor((minY - originY) / size) * size + originY,
    cellSize: size,
  };
};
