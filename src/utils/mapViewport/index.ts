/**
 * Pure pan/zoom math for the map canvas. Map space is the media's own pixel
 * grid; a viewport is the window onto it currently drawn to the canvas.
 */

export type Viewport = { x: number; y: number; zoom: number };
export type ScreenPoint = { x: number; y: number };
export type MapPoint = { x: number; y: number };

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;

/** Where a screen-space point (canvas-relative) lands in map space. */
export const screenToMapPoint = (
  viewport: Viewport,
  screenPoint: ScreenPoint,
): MapPoint => ({
  x: viewport.x + screenPoint.x / (viewport.zoom || 1),
  y: viewport.y + screenPoint.y / (viewport.zoom || 1),
});

/** A drag from `startScreenPoint` to `currentScreenPoint`, applied to `startViewport`. */
export const panViewport = ({
  startViewport,
  startScreenPoint,
  currentScreenPoint,
}: {
  startViewport: Viewport;
  startScreenPoint: ScreenPoint;
  currentScreenPoint: ScreenPoint;
}): Viewport => {
  const zoom = startViewport.zoom || 1;
  const dx = (currentScreenPoint.x - startScreenPoint.x) / zoom;
  const dy = (currentScreenPoint.y - startScreenPoint.y) / zoom;

  return { ...startViewport, x: startViewport.x - dx, y: startViewport.y - dy };
};

/**
 * Zooms so the map point under the cursor stays under the cursor — the
 * "zoom to cursor" feel a wheel-driven zoom is expected to have.
 */
export const zoomAtPoint = ({
  viewport,
  mapPoint,
  screenPoint,
  deltaY,
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM,
}: {
  viewport: Viewport;
  mapPoint: MapPoint;
  screenPoint: ScreenPoint;
  deltaY: number;
  minZoom?: number;
  maxZoom?: number;
}): Viewport => {
  const factor = Math.exp(-deltaY * 0.001);
  const nextZoom = Math.min(
    maxZoom,
    Math.max(minZoom, (viewport.zoom || 1) * factor),
  );

  return {
    zoom: nextZoom,
    x: mapPoint.x - screenPoint.x / nextZoom,
    y: mapPoint.y - screenPoint.y / nextZoom,
  };
};

/**
 * The viewport that fits a freshly loaded map/video to the canvas and
 * centers it — used identically for the image and video loading paths.
 */
export const computeCenteredViewport = ({
  canvasWidth,
  canvasHeight,
  mediaWidth,
  mediaHeight,
  currentZoom,
}: {
  canvasWidth: number;
  canvasHeight: number;
  mediaWidth: number;
  mediaHeight: number;
  currentZoom?: number;
}): Viewport => {
  const fitZoom =
    mediaWidth > 0 && mediaHeight > 0
      ? Math.min(canvasWidth / mediaWidth, canvasHeight / mediaHeight)
      : 1;
  const zoom = currentZoom ?? fitZoom;
  const viewWidth = canvasWidth / zoom;
  const viewHeight = canvasHeight / zoom;

  return {
    x: (mediaWidth - viewWidth) / 2,
    y: (mediaHeight - viewHeight) / 2,
    zoom,
  };
};

/** Whether a map-space point falls inside a rectangle given as origin + size. */
export const isPointInMapRect = (
  point: MapPoint,
  rectOrigin: MapPoint,
  rectSize: { width: number; height: number },
): boolean =>
  point.x >= rectOrigin.x &&
  point.x <= rectOrigin.x + rectSize.width &&
  point.y >= rectOrigin.y &&
  point.y <= rectOrigin.y + rectSize.height;
