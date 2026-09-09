'use client';

import { useEffect, useRef, type RefObject } from 'react';
import {
  panViewport,
  screenToMapPoint,
  zoomAtPoint,
  type MapPoint,
  type Viewport,
} from '~/utils/mapViewport';
import {
  isPointInLensRect,
  moveLensRect,
  zoomLensAtPoint,
  type LensRect,
} from '~/utils/mapLens';
import {
  isPointInTrackerRect,
  moveTrackerRect,
} from '~/utils/trackerOverlayRect';
import type {
  MapCanvasFogState,
  MapCanvasFogStroke,
  MapCanvasFogTool,
} from '~/organisms/MapCanvas/components/MapCanvasView';

const makeStrokeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export type ViewportInteractionHandle = {
  /** Map-space cursor position, for the fog brush's cursor preview. Null off-canvas. */
  cursorMapPosRef: RefObject<MapPoint | null>;
  /**
   * Map-space cursor position while calibrating, for the live rectangle
   * preview. Null before the pointer has moved since the first click.
   *
   * Deliberately never round-tripped through React/zustand state: nothing
   * outside this canvas needs the *live* point (only the fixed first click,
   * `calibrationStart`, is shared elsewhere), and doing so on every
   * `pointermove` was the same render-storm bug `onViewportChange` had.
   */
  calibrationPreviewRef: RefObject<MapPoint | null>;
};

/**
 * Wires pan, zoom, fog painting and grid-calibration clicks onto the canvas.
 *
 * All interaction state lives in refs so a drag never triggers a React
 * re-render — only `onScheduleDraw` fires, same as the rest of this canvas.
 * The pure pan/zoom math lives in `~/utils/mapViewport`, tested there; this
 * hook is the DOM wiring around it.
 */
export const useViewportInteraction = ({
  canvasRef,
  interactive,
  viewportRef,
  fogRef,
  fogToolRef,
  onFogStrokeBatch,
  calibrationActiveRef,
  onCalibrateClick,
  paintFogStroke,
  lensLockedRef,
  lensRectRef,
  lensScreenSizeRef,
  lensPreviewRef,
  onLensChange,
  trackerRectRef,
  trackerPreviewRef,
  onTrackerRectChange,
  onScheduleDraw,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  interactive: boolean;
  viewportRef: RefObject<Viewport>;
  fogRef: RefObject<MapCanvasFogState | undefined>;
  fogToolRef: RefObject<MapCanvasFogTool | undefined>;
  onFogStrokeBatch?: (strokes: MapCanvasFogStroke[]) => void;
  calibrationActiveRef: RefObject<boolean>;
  onCalibrateClick?: (point: MapPoint) => void;
  paintFogStroke: (stroke: MapCanvasFogStroke) => void;
  /** Blocks grabbing/wheel-zooming the lens without hiding it — the lens
   * itself stays always-visible and, when unlocked, always-interactive; there
   * is no separate "edit mode" to enter first. */
  lensLockedRef: RefObject<boolean>;
  lensRectRef: RefObject<LensRect | null>;
  /** The player screen's own pixel size, for converting the lens rect to/from
   * a zoom level when the wheel resizes it. */
  lensScreenSizeRef: RefObject<{ width: number; height: number }>;
  /** Live drag rect for the lens, owned by the caller (`MapCanvasView` also
   * reads it, at most once per animation frame, to notify `onLensChange`
   * live while dragging) — null when not actively being dragged. */
  lensPreviewRef: RefObject<LensRect | null>;
  onLensChange?: (rect: LensRect) => void;
  /** The tracker overlay's rect, nested inside the lens — null when the
   * Player Screen tab isn't open (see `trackerEditingActive`), so it's
   * neither drawn nor draggable outside that context. */
  trackerRectRef: RefObject<LensRect | null>;
  /** Live drag rect for the tracker overlay, same role as `lensPreviewRef`. */
  trackerPreviewRef: RefObject<LensRect | null>;
  onTrackerRectChange?: (rect: LensRect) => void;
  onScheduleDraw: () => void;
}): ViewportInteractionHandle => {
  const cursorMapPosRef = useRef<MapPoint | null>(null);
  const calibrationPreviewRef = useRef<MapPoint | null>(null);
  const dragModeRef = useRef<'pan' | 'fog' | 'lens' | 'tracker' | null>(null);
  const startScreenPointRef = useRef<MapPoint>({ x: 0, y: 0 });
  const startViewportRef = useRef<Viewport | null>(null);
  const startLensRectRef = useRef<LensRect | null>(null);
  const lensStartMapPointRef = useRef<MapPoint>({ x: 0, y: 0 });
  const startTrackerRectRef = useRef<LensRect | null>(null);
  const trackerStartMapPointRef = useRef<MapPoint>({ x: 0, y: 0 });
  const pendingStrokesRef = useRef<MapCanvasFogStroke[]>([]);

  // Latest callbacks in refs, so the listener-attaching effect below never
  // has to re-run (and re-attach) just because a callback prop changed identity.
  const onCalibrateClickRef = useRef(onCalibrateClick);
  const onFogStrokeBatchRef = useRef(onFogStrokeBatch);
  const onLensChangeRef = useRef(onLensChange);
  const onTrackerRectChangeRef = useRef(onTrackerRectChange);

  useEffect(() => {
    onCalibrateClickRef.current = onCalibrateClick;
  }, [onCalibrateClick]);
  useEffect(() => {
    onFogStrokeBatchRef.current = onFogStrokeBatch;
  }, [onFogStrokeBatch]);
  useEffect(() => {
    onLensChangeRef.current = onLensChange;
  }, [onLensChange]);
  useEffect(() => {
    onTrackerRectChangeRef.current = onTrackerRectChange;
  }, [onTrackerRectChange]);

  useEffect(() => {
    if (!interactive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mapPointFromEvent = (event: PointerEvent | WheelEvent) => {
      const rect = canvas.getBoundingClientRect();
      const screenPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const viewport = viewportRef.current;
      return {
        mapPoint: screenToMapPoint(viewport, screenPoint),
        screenPoint,
        viewport,
      };
    };

    const createFogStroke = (mapPoint: MapPoint): MapCanvasFogStroke | null => {
      const tool = fogToolRef.current;
      if (!tool?.enabled || !fogRef.current?.enabled) return null;

      return {
        id: makeStrokeId(),
        x: mapPoint.x,
        y: mapPoint.y,
        radius: Math.max(2, tool.size),
        softness: Math.min(Math.max(tool.softness, 0), 1),
        shape: tool.shape,
        mode: tool.mode,
      };
    };

    // While the fog brush is armed, or grid calibration is awaiting its next
    // click, that tool always wins over grabbing the lens — including a
    // click/stroke inside the lens rect itself. Moving or wheel-zooming the
    // lens is blocked for the same reason `lensLocked` blocks it, so a
    // calibration click or paint stroke can never be mistaken for a lens drag.
    const isFogToolActive = () =>
      !!(fogToolRef.current?.enabled && fogRef.current?.enabled);

    const handlePointerDown = (event: PointerEvent) => {
      const { mapPoint } = mapPointFromEvent(event);

      // The tracker rect is nested inside the lens, so it must win the hit
      // test when the two overlap — otherwise a click meant for the tracker
      // would always grab the (larger) lens instead. Gated by the same
      // `lensLockedRef` the lens itself uses, rather than a second lock.
      if (
        !isFogToolActive() &&
        !calibrationActiveRef.current &&
        !lensLockedRef.current &&
        trackerRectRef.current &&
        isPointInTrackerRect(trackerRectRef.current, mapPoint)
      ) {
        dragModeRef.current = 'tracker';
        trackerStartMapPointRef.current = mapPoint;
        startTrackerRectRef.current = trackerRectRef.current;
        trackerPreviewRef.current = trackerRectRef.current;
        canvas.setPointerCapture(event.pointerId);
        return;
      }

      if (
        !isFogToolActive() &&
        !calibrationActiveRef.current &&
        !lensLockedRef.current &&
        lensRectRef.current &&
        isPointInLensRect(lensRectRef.current, mapPoint)
      ) {
        dragModeRef.current = 'lens';
        lensStartMapPointRef.current = mapPoint;
        startLensRectRef.current = lensRectRef.current;
        lensPreviewRef.current = lensRectRef.current;
        canvas.setPointerCapture(event.pointerId);
        return;
      }

      if (calibrationActiveRef.current) {
        // A fresh two-click session: the previous session's live point (if
        // any) must not flash as this one's rectangle for a frame.
        calibrationPreviewRef.current = null;
        onCalibrateClickRef.current?.(mapPoint);
        return;
      }

      const stroke = createFogStroke(mapPoint);
      if (stroke) {
        dragModeRef.current = 'fog';
        pendingStrokesRef.current = [stroke];
        paintFogStroke(stroke);
        onScheduleDraw();
        canvas.setPointerCapture(event.pointerId);
        return;
      }

      dragModeRef.current = 'pan';
      startScreenPointRef.current = { x: event.clientX, y: event.clientY };
      startViewportRef.current = viewportRef.current;
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const { mapPoint } = mapPointFromEvent(event);
      cursorMapPosRef.current = mapPoint;

      if (fogToolRef.current?.enabled) onScheduleDraw();

      if (dragModeRef.current === 'lens' && startLensRectRef.current) {
        lensPreviewRef.current = moveLensRect(startLensRectRef.current, {
          dx: mapPoint.x - lensStartMapPointRef.current.x,
          dy: mapPoint.y - lensStartMapPointRef.current.y,
        });
        onScheduleDraw();
        return;
      }

      if (dragModeRef.current === 'tracker' && startTrackerRectRef.current) {
        // Clamped against the *current* lens (not the lens at drag-start),
        // so the tracker still can't escape it even if the lens itself is
        // moving between frames — the two drag modes are mutually exclusive,
        // but the lens can still change from the DM's own pan/zoom mutation
        // round-tripping back down while this drag is in progress.
        const lens = lensRectRef.current;
        if (lens) {
          trackerPreviewRef.current = moveTrackerRect(
            lens,
            startTrackerRectRef.current,
            {
              dx: mapPoint.x - trackerStartMapPointRef.current.x,
              dy: mapPoint.y - trackerStartMapPointRef.current.y,
            },
          );
          onScheduleDraw();
        }
        return;
      }

      if (calibrationActiveRef.current) {
        calibrationPreviewRef.current = mapPoint;
        onScheduleDraw();
        return;
      }

      if (dragModeRef.current === 'fog') {
        const stroke = createFogStroke(mapPoint);
        if (stroke) {
          pendingStrokesRef.current.push(stroke);
          paintFogStroke(stroke);
          onScheduleDraw();
        }
        return;
      }

      if (dragModeRef.current === 'pan' && startViewportRef.current) {
        const next = panViewport({
          startViewport: startViewportRef.current,
          startScreenPoint: startScreenPointRef.current,
          currentScreenPoint: { x: event.clientX, y: event.clientY },
        });
        viewportRef.current = next;
        onScheduleDraw();
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (dragModeRef.current === 'fog' && pendingStrokesRef.current.length) {
        onFogStrokeBatchRef.current?.(pendingStrokesRef.current);
        pendingStrokesRef.current = [];
      }

      // A safety-net final commit — the live per-frame notify in
      // MapCanvasView's draw loop can in principle miss the very last pixel
      // if a pointerup lands between two animation frames.
      if (dragModeRef.current === 'lens' && lensPreviewRef.current) {
        onLensChangeRef.current?.(lensPreviewRef.current);
      }
      lensPreviewRef.current = null;
      startLensRectRef.current = null;

      if (dragModeRef.current === 'tracker' && trackerPreviewRef.current) {
        onTrackerRectChangeRef.current?.(trackerPreviewRef.current);
      }
      trackerPreviewRef.current = null;
      startTrackerRectRef.current = null;

      dragModeRef.current = null;
      startViewportRef.current = null;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    const handlePointerLeave = () => {
      cursorMapPosRef.current = null;
      onScheduleDraw();
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const { mapPoint, screenPoint, viewport } = mapPointFromEvent(event);

      if (
        !isFogToolActive() &&
        !calibrationActiveRef.current &&
        !lensLockedRef.current &&
        lensRectRef.current &&
        isPointInLensRect(lensRectRef.current, mapPoint)
      ) {
        const { width, height } = lensScreenSizeRef.current;
        const next = zoomLensAtPoint(
          lensRectRef.current,
          width,
          height,
          mapPoint,
          event.deltaY,
        );
        lensRectRef.current = next;
        onLensChangeRef.current?.(next);
        onScheduleDraw();
        return;
      }

      const next = zoomAtPoint({
        viewport,
        mapPoint,
        screenPoint,
        deltaY: event.deltaY,
      });

      viewportRef.current = next;
      onScheduleDraw();
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('wheel', handleWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, canvasRef]);

  return { cursorMapPosRef, calibrationPreviewRef };
};
