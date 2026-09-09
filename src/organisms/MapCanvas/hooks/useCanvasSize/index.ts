'use client';

import { useEffect, useRef, type RefObject } from 'react';

export type CssSize = { width: number; height: number };
export type CanvasSize = CssSize & { dpr: number };

/**
 * Backing-store pixels scale with the square of device pixel ratio, so an
 * uncapped 3x display rasterizes over twice what a 2x one does for the same
 * on-screen size. Capping trades a little sharpness for meaningfully less
 * work every frame — the kind of thing that matters on older hardware.
 */
export const MAX_DEVICE_PIXEL_RATIO = 2;

export const clampDevicePixelRatio = (dpr: number): number =>
  Math.min(dpr, MAX_DEVICE_PIXEL_RATIO);

/** The backing-store size a CSS size needs at a given device pixel ratio. */
export const toDevicePixelSize = (size: CssSize, dpr: number): CssSize => ({
  width: Math.round(size.width * dpr),
  height: Math.round(size.height * dpr),
});

/**
 * Tracks a canvas element's CSS size via `ResizeObserver` and keeps its
 * backing store sized for the current (capped) device pixel ratio.
 *
 * The dpr actually used is returned alongside width/height, not re-derived
 * by callers — `MapCanvasView`'s draw loop used to read
 * `window.devicePixelRatio` itself, which could drift from what the backing
 * store was actually sized for and would have silently ignored the cap.
 *
 * Exposed as a ref rather than React state: a resize should redraw the
 * canvas, not re-render the component around it, so `onResize` is the only
 * thing that fires — mirroring the interaction hooks' ref-based state.
 */
export const useCanvasSize = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  onResize: () => void,
): RefObject<CanvasSize> => {
  const sizeRef = useRef<CanvasSize>({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const measure = (cssSize: CssSize) => {
      const dpr = clampDevicePixelRatio(window.devicePixelRatio || 1);
      sizeRef.current = { ...cssSize, dpr };

      const { width, height } = toDevicePixelSize(cssSize, dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      onResize();
    };

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        measure({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(canvas);

    const initialRect = canvas.getBoundingClientRect();
    measure({ width: initialRect.width, height: initialRect.height });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef]);

  return sizeRef;
};
