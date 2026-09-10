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
import {
  computeAimPreview,
  computeMeasurementPreview,
  isPointInShapeFootprint,
  snapPointToGrid,
  type GridSpec,
  type MeasurementShapeInput,
} from '~/utils/mapMeasurement';
import type {
  MapCanvasFogState,
  MapCanvasFogStroke,
  MapCanvasFogTool,
  MapCanvasMeasurementShape,
  MapCanvasMeasurementTool,
} from '~/organisms/MapCanvas/components/MapCanvasView';

const makeStrokeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export type ViewportInteractionHandle = {
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
  /** The id of the placed shape currently being dragged to a new position,
   * or null. `MapCanvasView`'s draw loop skips this shape when drawing the
   * committed list — its live position is drawn from `measurementPreviewRef`
   * instead, so it isn't rendered twice (once stale, once live). */
  movingShapeIdRef: RefObject<string | null>;
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
  measurementToolRef,
  gridRef,
  measurementPreviewRef,
  onMeasurementConfirm,
  measurementShapesRef,
  selectedMeasurementShapeIdRef,
  onSelectMeasurementShape,
  onMeasurementShapeMoved,
  cursorMapPosRef,
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
  /** Armed like the fog brush — while enabled, a click either sets a shape's
   * origin or (if one is already pending) confirms it. */
  measurementToolRef: RefObject<MapCanvasMeasurementTool | undefined>;
  /** Only `cellSize`/`originX`/`originY` are read, for snapping the origin
   * and grid-square-counting the extent — see `~/utils/mapMeasurement`. */
  gridRef: RefObject<GridSpec>;
  /** The shape currently being aimed — null once there is nothing pending.
   * Owned by the caller (`MapCanvasView` reads it, at most once per
   * animation frame, to notify `onMeasurementPreviewChange` live while
   * placing), the same role `lensPreviewRef` plays for the lens. */
  measurementPreviewRef: RefObject<MeasurementShapeInput | null>;
  onMeasurementConfirm?: (shape: MeasurementShapeInput) => void;
  /** Every shape already placed on this map, for the click-to-select hit
   * test — reused rather than re-fetched. */
  measurementShapesRef: RefObject<MapCanvasMeasurementShape[]>;
  /** Mirrors the caller's selection, so a click on empty canvas (with the
   * tool disarmed) knows whether there's anything to deselect. */
  selectedMeasurementShapeIdRef: RefObject<string | null>;
  onSelectMeasurementShape?: (id: string | null) => void;
  /** Fired once, on release, at the end of a drag-to-move — not per frame;
   * the live position during the drag is only ever local (`measurementPreviewRef`). */
  onMeasurementShapeMoved?: (id: string, origin: MapPoint) => void;
  /** Owned by the caller (`MapCanvasView` reads it, at most once per
   * animation frame, to notify `onMeasurementCursorChange` live while the
   * tool is armed) — the same ownership `measurementPreviewRef` has. */
  cursorMapPosRef: RefObject<MapPoint | null>;
  onScheduleDraw: () => void;
}): ViewportInteractionHandle => {
  const calibrationPreviewRef = useRef<MapPoint | null>(null);
  const measurementOriginRef = useRef<MapPoint | null>(null);
  const movingShapeIdRef = useRef<string | null>(null);
  const movingShapeStartOriginRef = useRef<MapPoint | null>(null);
  const movingShapeStartPointRef = useRef<MapPoint>({ x: 0, y: 0 });
  const dragModeRef = useRef<
    'pan' | 'fog' | 'lens' | 'tracker' | 'measurement-move' | null
  >(null);
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
  const onMeasurementConfirmRef = useRef(onMeasurementConfirm);
  const onSelectMeasurementShapeRef = useRef(onSelectMeasurementShape);
  const onMeasurementShapeMovedRef = useRef(onMeasurementShapeMoved);

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
    onMeasurementConfirmRef.current = onMeasurementConfirm;
  }, [onMeasurementConfirm]);
  useEffect(() => {
    onSelectMeasurementShapeRef.current = onSelectMeasurementShape;
  }, [onSelectMeasurementShape]);
  useEffect(() => {
    onMeasurementShapeMovedRef.current = onMeasurementShapeMoved;
  }, [onMeasurementShapeMoved]);

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
    const isMeasurementToolActive = () => !!measurementToolRef.current?.enabled;

    /** The shape to preview/confirm from an already-clicked origin and the
     * current cursor. A preset-sized, orientable shape (a spell's cone/line/
     * cube) keeps its extent fixed and only aims — a circle has no facing to
     * aim, and a ruler has no size of its own and always free-drags
     * (DECISIONS #27), so a leftover `presetExtentFeet` from a previously
     * selected shape type is ignored for both, same as a custom (no-preset)
     * shape, all three via `computeMeasurementPreview`. Called from the
     * pointermove handler too, unguarded by `isMeasurementToolActive` (an
     * in-progress drag must keep previewing even if the tool prop goes away
     * mid-drag, e.g. the DM switches maps), so `tool` falls back the same
     * way that call site always has. */
    const previewFromOrigin = (
      origin: MapPoint,
      cursor: MapPoint,
    ): MeasurementShapeInput => {
      const tool = measurementToolRef.current;
      const shapeType = tool?.shapeType ?? 'circle';
      const isAimable = shapeType !== 'circle' && shapeType !== 'ruler';
      return tool?.presetExtentFeet && isAimable
        ? computeAimPreview({
            shapeType,
            origin,
            cursor,
            extentFeet: tool.presetExtentFeet,
          })
        : computeMeasurementPreview({
            shapeType,
            origin,
            cursor,
            grid: gridRef.current,
          });
    };

    // A placed shape wins the hit test over the lens/tracker the same way
    // the fog brush and calibration already do — the lens defaults to an
    // uncalibrated, screen-sized rect (`computeLensRect` off the session's
    // defaults) that would otherwise blanket almost any click meant for a
    // shape sitting on the visible map. Only computed (and only matters)
    // while the placement tool is disarmed; an armed click always places.
    const findHitMeasurementShape = (point: MapPoint) => {
      if (
        isFogToolActive() ||
        calibrationActiveRef.current ||
        isMeasurementToolActive()
      ) {
        return null;
      }

      const grid = gridRef.current;
      const shapes = measurementShapesRef.current;
      // Last placed = drawn on top, so an overlap grabs the most recent one.
      for (let i = shapes.length - 1; i >= 0; i -= 1) {
        if (isPointInShapeFootprint(shapes[i]!, grid, point)) return shapes[i]!;
      }
      return null;
    };

    const cancelMeasurement = () => {
      measurementOriginRef.current = null;
      measurementPreviewRef.current = null;
      movingShapeIdRef.current = null;
      movingShapeStartOriginRef.current = null;
      dragModeRef.current = null;
      onScheduleDraw();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const { mapPoint } = mapPointFromEvent(event);
      const hitShape = findHitMeasurementShape(mapPoint);

      // The tracker rect is nested inside the lens, so it must win the hit
      // test when the two overlap — otherwise a click meant for the tracker
      // would always grab the (larger) lens instead. Gated by the same
      // `lensLockedRef` the lens itself uses, rather than a second lock.
      if (
        !isFogToolActive() &&
        !calibrationActiveRef.current &&
        !isMeasurementToolActive() &&
        !hitShape &&
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
        !isMeasurementToolActive() &&
        !hitShape &&
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

      if (isMeasurementToolActive()) {
        const tool = measurementToolRef.current!;
        const grid = gridRef.current;

        if (!measurementOriginRef.current) {
          const origin = snapPointToGrid(mapPoint, grid);

          // A circle/sphere has no facing to aim, preset or not — one click
          // is the whole placement. Every other preset shape (a spell's
          // cone/line/cube) arms a second, aiming click instead of
          // committing immediately, same as a ruler or a custom size
          // already do — see `previewFromOrigin`.
          if (tool.presetExtentFeet && tool.shapeType === 'circle') {
            onMeasurementConfirmRef.current?.({
              shapeType: tool.shapeType,
              originX: origin.x,
              originY: origin.y,
              extentFeet: tool.presetExtentFeet,
              orientation: null,
            });
            onScheduleDraw();
            return;
          }

          measurementOriginRef.current = origin;
          measurementPreviewRef.current = previewFromOrigin(origin, mapPoint);
          onScheduleDraw();
          return;
        }

        const finalShape = previewFromOrigin(
          measurementOriginRef.current,
          mapPoint,
        );
        onMeasurementConfirmRef.current?.(finalShape);
        measurementOriginRef.current = null;
        measurementPreviewRef.current = null;
        onScheduleDraw();
        return;
      }

      // The placement tool is disarmed at this point (the block above always
      // returns when it's armed) — a click here either grabs an already-
      // placed shape to drag it, or, on empty canvas, clears a selection.
      if (hitShape) {
        dragModeRef.current = 'measurement-move';
        movingShapeIdRef.current = hitShape.id;
        movingShapeStartOriginRef.current = {
          x: hitShape.originX,
          y: hitShape.originY,
        };
        movingShapeStartPointRef.current = mapPoint;
        measurementPreviewRef.current = {
          shapeType: hitShape.shapeType,
          originX: hitShape.originX,
          originY: hitShape.originY,
          extentFeet: hitShape.extentFeet,
          orientation: hitShape.orientation,
        };
        onSelectMeasurementShapeRef.current?.(hitShape.id);
        canvas.setPointerCapture(event.pointerId);
        onScheduleDraw();
        return;
      }

      if (selectedMeasurementShapeIdRef.current) {
        onSelectMeasurementShapeRef.current?.(null);
        onScheduleDraw();
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

      // Schedules a draw purely so the RAF loop's cursor-broadcast diff (in
      // `MapCanvasView`) runs — needed even here, before an origin is
      // clicked, so the player screen's "aim" reticle tracks the DM's
      // cursor from the moment the tool is armed.
      if (fogToolRef.current?.enabled || measurementToolRef.current?.enabled) {
        onScheduleDraw();
      }

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

      if (
        dragModeRef.current === 'measurement-move' &&
        movingShapeStartOriginRef.current &&
        movingShapeIdRef.current
      ) {
        const shape = measurementShapesRef.current.find(
          candidate => candidate.id === movingShapeIdRef.current,
        );
        if (shape) {
          const start = movingShapeStartOriginRef.current;
          const startPoint = movingShapeStartPointRef.current;
          const dragged = {
            x: start.x + (mapPoint.x - startPoint.x),
            y: start.y + (mapPoint.y - startPoint.y),
          };
          const snapped = snapPointToGrid(dragged, gridRef.current);
          measurementPreviewRef.current = {
            shapeType: shape.shapeType,
            originX: snapped.x,
            originY: snapped.y,
            extentFeet: shape.extentFeet,
            orientation: shape.orientation,
          };
          onScheduleDraw();
        }
        return;
      }

      if (measurementOriginRef.current) {
        measurementPreviewRef.current = previewFromOrigin(
          measurementOriginRef.current,
          mapPoint,
        );
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

      if (dragModeRef.current === 'measurement-move') {
        if (movingShapeIdRef.current && measurementPreviewRef.current) {
          onMeasurementShapeMovedRef.current?.(movingShapeIdRef.current, {
            x: measurementPreviewRef.current.originX,
            y: measurementPreviewRef.current.originY,
          });
        }
        // Only reset here — a plain two-click placement (no drag mode of its
        // own) also passes through this handler on its first click's
        // pointerup, and must not have its just-set preview wiped.
        movingShapeIdRef.current = null;
        movingShapeStartOriginRef.current = null;
        measurementPreviewRef.current = null;
      }

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

      // Nested inside the lens, the tracker rect has no wheel gesture of its
      // own (its size is a settings-tab slider, not a drag/scroll) — so a
      // wheel over it must fall through to the DM's own background zoom
      // rather than resizing the lens underneath it, the same priority the
      // tracker already gets in `handlePointerDown`.
      const overTracker =
        !lensLockedRef.current &&
        trackerRectRef.current &&
        isPointInTrackerRect(trackerRectRef.current, mapPoint);

      if (
        !isFogToolActive() &&
        !calibrationActiveRef.current &&
        !isMeasurementToolActive() &&
        !lensLockedRef.current &&
        !overTracker &&
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

    // Right-click abandons a shape placement or an in-progress drag-to-move,
    // rather than opening the browser's context menu over the canvas.
    const handleContextMenu = (event: MouseEvent) => {
      if (!measurementOriginRef.current && !movingShapeIdRef.current) return;
      event.preventDefault();
      cancelMeasurement();
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, canvasRef]);

  return { calibrationPreviewRef, movingShapeIdRef };
};
