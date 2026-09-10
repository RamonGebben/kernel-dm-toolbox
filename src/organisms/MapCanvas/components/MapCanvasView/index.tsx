'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { type MapPoint, type Viewport } from '~/utils/mapViewport';
import type { LensRect } from '~/utils/mapLens';
import { useCanvasSize } from '~/organisms/MapCanvas/hooks/useCanvasSize';
import { useMapMedia } from '~/organisms/MapCanvas/hooks/useMapMedia';
import { useFogMask } from '~/organisms/MapCanvas/hooks/useFogMask';
import { useGridOverlay } from '~/organisms/MapCanvas/hooks/useGridOverlay';
import { useViewportInteraction } from '~/organisms/MapCanvas/hooks/useViewportInteraction';
import { useSpellEffectVideoCache } from '~/organisms/MapCanvas/hooks/useSpellEffectVideos';
import {
  buildMeasurementLabelText,
  computeShapeFootprint,
  computeShapeLabelAnchor,
  computeShapeVideoBounds,
  isEffectPlaying,
  type GridSpec,
  type MeasurementShapeInput,
  type MeasurementShapeType,
} from '~/utils/mapMeasurement';

export type MapCanvasFogStrokeShape = 'circle' | 'square';
export type MapCanvasFogStrokeMode = 'reveal' | 'cover';

export type MapCanvasFogStroke = {
  id: string;
  x: number;
  y: number;
  radius: number;
  softness: number;
  shape: MapCanvasFogStrokeShape;
  mode: MapCanvasFogStrokeMode;
};

export type MapCanvasFogState = {
  enabled: boolean;
  baseState: 'covered' | 'revealed';
  strokes: MapCanvasFogStroke[];
};

export type MapCanvasFogTool = {
  enabled: boolean;
  mode: MapCanvasFogStrokeMode;
  shape: MapCanvasFogStrokeShape;
  size: number;
  softness: number;
};

export type MapCanvasGridSettings = {
  visible: boolean;
  color: string;
  opacity: number;
  cellSize: number;
  originX: number;
  originY: number;
};

export type MapCanvasMedia = {
  fileUrl: string;
  kind: 'image' | 'video';
  /** A size already known from a previous session, so the grid and fog size
   * correctly before this load's `onMediaDimensions` fires. */
  nativeWidth?: number | null;
  nativeHeight?: number | null;
} | null;

export type CalibrationPoint = { x: number; y: number };

/** A committed ruler/spell-area shape, ready to draw. */
export type MapCanvasMeasurementShape = MeasurementShapeInput & {
  id: string;
  color: string;
  label?: string | null;
  /** Where to play this shape's animated effect from, if it came from a
   * spell that matched one — null otherwise, or on a plain ruler. A 404
   * (spell matched to no clip) falls back to the static shape, same as
   * null. */
  effectUrl?: string | null;
  /** Epoch ms; null unless `effectUrl` is also set. Set once at creation,
   * never touched by a later move. */
  effectStartedAtMs?: number | null;
};

/** The armed placement tool — while enabled, a canvas click either sets a
 * shape's origin or (if one is pending) confirms it. `color` drives the
 * live-drag preview's stroke before the shape has an id of its own. */
export type MapCanvasMeasurementTool = {
  enabled: boolean;
  shapeType: MeasurementShapeType;
  color: string;
  /** A chosen size preset: the next click commits a shape at exactly this
   * size instead of arming the two-click free-drag gesture. Null is the
   * free-drag default. */
  presetExtentFeet: number | null;
  /** Shown on the live-drag preview's label alongside its distance. */
  label: string | null;
};

export type MapCanvasViewProps = {
  map: MapCanvasMedia;
  viewport: Viewport;
  /** DM screen = true; a read-only preview (later: the player screen) = false. */
  interactive?: boolean;
  onViewportChange?: (viewport: Viewport) => void;
  grid: MapCanvasGridSettings;
  fog?: MapCanvasFogState;
  /** DM and player screens render the same fog at different opacities. */
  fogOpacity?: number;
  fogTool?: MapCanvasFogTool;
  onFogStrokeBatch?: (strokes: MapCanvasFogStroke[]) => void;
  calibrationActive?: boolean;
  calibrationStart?: CalibrationPoint | null;
  onCalibrateClick?: (point: CalibrationPoint) => void;
  onMediaDimensions?: (size: { width: number; height: number }) => void;
  backgroundColor?: string;
  /** The committed player-view lens — null when there's nothing to show yet.
   * Always drawn once present and always draggable/wheel-zoomable unless
   * `lensLocked` — there is no separate "edit mode" to enter first. */
  lensRect?: LensRect | null;
  /** Blocks grabbing or wheel-zooming the lens without hiding it. */
  lensLocked?: boolean;
  /** The player screen's own pixel size — the lens's wheel-zoom converts
   * to/from a zoom level against it, since the lens can only ever show what
   * their canvas can. */
  lensScreenSize?: { width: number; height: number };
  onLensChange?: (rect: LensRect) => void;
  /** The tracker overlay's rect, nested inside the lens. The caller passes
   * `null` outside the Player Screen tab (see `useMapCanvas`), which is what
   * makes it neither drawn nor draggable then — a single source of truth,
   * the same way a `null` `lensRect` means "nothing to show yet" for it. */
  trackerRect?: LensRect | null;
  onTrackerRectChange?: (rect: LensRect) => void;
  /** Every shape already placed on this map — drawn on both the DM and
   * player screens, always, since none of them are secret (issue #1). */
  measurementShapes?: MapCanvasMeasurementShape[];
  /** The armed placement tool. Undefined/disabled on the player screen,
   * which never places anything itself. */
  measurementTool?: MapCanvasMeasurementTool;
  /** The shape currently being aimed, live — either this DM's own drag
   * (reflected immediately via a local ref) or, on the player screen, the
   * committed session field arriving over SSE. */
  livePreviewShape?: MapCanvasMeasurementShape | null;
  onMeasurementConfirm?: (shape: MeasurementShapeInput) => void;
  /** Fires at most once per animation frame while a shape is being aimed —
   * the same cadence `onLensChange` uses — so the player screen can track
   * it live via `setLivePreviewShape`. */
  onMeasurementPreviewChange?: (shape: MeasurementShapeInput | null) => void;
  /** The DM's raw cursor position while the tool is armed but no origin has
   * been clicked yet — null once a shape preview exists (it takes over) or
   * there's nothing to show. Only meaningful on the player screen; the DM's
   * own canvas already shows their actual cursor. */
  measurementCursor?: MapPoint | null;
  /** Fires at most once per animation frame while the tool is armed and the
   * cursor is over the canvas — the "aim" reticle feed for the player
   * screen, via `setMeasurementCursor`. */
  onMeasurementCursorChange?: (point: MapPoint | null) => void;
  /** Highlights one placed shape — set by clicking it (see
   * `onSelectMeasurementShape`) or a row in the Measure panel's list. */
  selectedMeasurementShapeId?: string | null;
  /** Fired when a placed shape is clicked (selects it) or empty canvas is
   * clicked while something was selected (clears it). Only fires while the
   * placement tool is disarmed — an armed click always places instead. */
  onSelectMeasurementShape?: (id: string | null) => void;
  /** Fired once, on release, after dragging a placed shape to a new
   * position — not per frame; the drag itself is only ever local. */
  onMeasurementShapeMoved?: (
    id: string,
    origin: { x: number; y: number },
  ) => void;
};

const DEFAULT_BACKGROUND = '#0f1014';
const DEFAULT_FOG_OPACITY = 0.8;

/**
 * The battle map canvas: a single `<canvas>` 2D context rendering the map
 * image/video under a pan/zoom viewport, a grid overlay, and a fog-of-war
 * mask, with pointer/wheel interaction for pan, zoom, fog painting and grid
 * calibration.
 *
 * All per-frame interaction state lives in refs rather than React state —
 * committing every pointer move to state would mean a re-render per pixel
 * dragged. `viewport`/`fog`/etc. arrive as controlled props; the refs mirror
 * them for the draw loop to read without triggering it via React itself.
 * `scheduleDraw` is the one shared "please redraw" signal every hook below
 * uses instead of returning new state.
 */
export const MapCanvasView = ({
  map,
  viewport,
  interactive = false,
  onViewportChange,
  grid,
  fog,
  fogOpacity,
  fogTool,
  onFogStrokeBatch,
  calibrationActive = false,
  calibrationStart = null,
  onCalibrateClick,
  onMediaDimensions,
  backgroundColor,
  lensRect = null,
  lensLocked = false,
  lensScreenSize,
  onLensChange,
  trackerRect = null,
  onTrackerRectChange,
  measurementShapes = [],
  measurementTool,
  livePreviewShape = null,
  onMeasurementConfirm,
  onMeasurementPreviewChange,
  measurementCursor = null,
  onMeasurementCursorChange,
  selectedMeasurementShapeId = null,
  onSelectMeasurementShape,
  onMeasurementShapeMoved,
}: MapCanvasViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafIdRef = useRef(0);
  const drawRef = useRef<() => void>(() => {});

  const [mapSize, setMapSize] = useState({
    width: map?.nativeWidth ?? 0,
    height: map?.nativeHeight ?? 0,
  });

  const viewportRef = useRef<Viewport>(viewport);
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  /**
   * `onViewportChange` fires from inside the RAF callback below, at most once
   * per animation frame — never synchronously from a DOM event handler. A
   * raw `pointermove`/`wheel` stream can fire far faster than the display
   * repaints; calling back into React at that rate is what caused the jank
   * this component used to have (every call re-rendered the parent, which
   * rebuilt `grid` as a new object, which re-ran the draw effect *again*,
   * synchronously, outside this scheduler).
   */
  const onViewportChangeRef = useRef(onViewportChange);
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);
  const lastNotifiedViewportRef = useRef<Viewport>(viewport);

  const fogRef = useRef(fog);
  useEffect(() => {
    fogRef.current = fog;
  }, [fog]);

  const fogToolRef = useRef(fogTool);
  useEffect(() => {
    fogToolRef.current = fogTool;
  }, [fogTool]);

  const calibrationActiveRef = useRef(calibrationActive);
  useEffect(() => {
    calibrationActiveRef.current = calibrationActive;
  }, [calibrationActive]);

  const calibrationStartRef = useRef(calibrationStart);
  useEffect(() => {
    calibrationStartRef.current = calibrationStart;
  }, [calibrationStart]);

  const lensRectRef = useRef(lensRect);
  useEffect(() => {
    lensRectRef.current = lensRect;
  }, [lensRect]);

  const lensLockedRef = useRef(lensLocked);
  useEffect(() => {
    lensLockedRef.current = lensLocked;
  }, [lensLocked]);

  const lensScreenSizeRef = useRef(
    lensScreenSize ?? { width: 1920, height: 1080 },
  );
  useEffect(() => {
    lensScreenSizeRef.current = lensScreenSize ?? { width: 1920, height: 1080 };
  }, [lensScreenSize]);

  /** Live drag rect for the lens — same role, and same "ref not state"
   * reason, as `calibrationPreviewRef` inside `useViewportInteraction`. Owned
   * here (rather than by that hook) because `scheduleDraw` below needs to
   * read it to notify `onLensChange` live, at most once per frame. */
  const lensPreviewRef = useRef<LensRect | null>(null);

  const onLensChangeRef = useRef(onLensChange);
  useEffect(() => {
    onLensChangeRef.current = onLensChange;
  }, [onLensChange]);

  /** Mirrors `lastNotifiedViewportRef` below — the lens is notified live
   * while being dragged, but at most once per animation frame. */
  const lastNotifiedLensRef = useRef<LensRect | null>(null);

  const trackerRectRef = useRef(trackerRect);
  useEffect(() => {
    trackerRectRef.current = trackerRect;
  }, [trackerRect]);

  /** Same role as `lensPreviewRef`, for the tracker overlay's rect. */
  const trackerPreviewRef = useRef<LensRect | null>(null);

  const onTrackerRectChangeRef = useRef(onTrackerRectChange);
  useEffect(() => {
    onTrackerRectChangeRef.current = onTrackerRectChange;
  }, [onTrackerRectChange]);

  /** Mirrors `lastNotifiedLensRef`, for the tracker overlay. */
  const lastNotifiedTrackerRef = useRef<LensRect | null>(null);

  const measurementShapesRef = useRef(measurementShapes);
  useEffect(() => {
    measurementShapesRef.current = measurementShapes;
  }, [measurementShapes]);

  const measurementToolRef = useRef(measurementTool);
  useEffect(() => {
    measurementToolRef.current = measurementTool;
  }, [measurementTool]);

  const livePreviewShapeRef = useRef(livePreviewShape);
  useEffect(() => {
    livePreviewShapeRef.current = livePreviewShape;
  }, [livePreviewShape]);

  const gridSpecRef = useRef<GridSpec>({
    cellSize: grid.cellSize,
    originX: grid.originX,
    originY: grid.originY,
  });
  useEffect(() => {
    gridSpecRef.current = {
      cellSize: grid.cellSize,
      originX: grid.originX,
      originY: grid.originY,
    };
  }, [grid.cellSize, grid.originX, grid.originY]);

  /** Live preview for a shape being placed — this DM's own drag, updated
   * synchronously by `useViewportInteraction` on every click/move. Same
   * "ref not state" role as `lensPreviewRef`. */
  const measurementPreviewRef = useRef<MeasurementShapeInput | null>(null);

  const onMeasurementConfirmRef = useRef(onMeasurementConfirm);
  useEffect(() => {
    onMeasurementConfirmRef.current = onMeasurementConfirm;
  }, [onMeasurementConfirm]);

  const onMeasurementPreviewChangeRef = useRef(onMeasurementPreviewChange);
  useEffect(() => {
    onMeasurementPreviewChangeRef.current = onMeasurementPreviewChange;
  }, [onMeasurementPreviewChange]);

  /** Mirrors `lastNotifiedLensRef`, for the measurement preview. */
  const lastNotifiedMeasurementRef = useRef<MeasurementShapeInput | null>(null);

  const measurementCursorRef = useRef(measurementCursor);
  useEffect(() => {
    measurementCursorRef.current = measurementCursor;
  }, [measurementCursor]);

  const onMeasurementCursorChangeRef = useRef(onMeasurementCursorChange);
  useEffect(() => {
    onMeasurementCursorChangeRef.current = onMeasurementCursorChange;
  }, [onMeasurementCursorChange]);

  /** Mirrors `lastNotifiedMeasurementRef`, for the DM's own "aim" cursor
   * broadcast while the tool is armed and nothing is being placed yet. */
  const lastNotifiedCursorRef = useRef<MapPoint | null>(null);

  const selectedMeasurementShapeIdRef = useRef(selectedMeasurementShapeId);
  useEffect(() => {
    selectedMeasurementShapeIdRef.current = selectedMeasurementShapeId;
  }, [selectedMeasurementShapeId]);

  /** Owned here (rather than by `useViewportInteraction`) so `scheduleDraw`
   * below can read it to broadcast the DM's "aim" cursor live — the same
   * "caller owns it because the RAF loop needs it" reasoning as
   * `measurementPreviewRef`/`lensPreviewRef`. */
  const cursorMapPosRef = useRef<MapPoint | null>(null);

  const scheduleDraw = useMemo(
    () => () => {
      if (rafIdRef.current !== 0) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = 0;
        drawRef.current();

        // Notify the outside world at most once per frame, and only when the
        // value actually moved — a pan/zoom gesture can call `scheduleDraw`
        // far more often than the viewport itself changes between two ticks.
        const current = viewportRef.current;
        const last = lastNotifiedViewportRef.current;
        if (
          current.x !== last.x ||
          current.y !== last.y ||
          current.zoom !== last.zoom
        ) {
          lastNotifiedViewportRef.current = current;
          onViewportChangeRef.current?.(current);
        }

        // Same "at most once per frame, only if it moved" notify for the
        // lens while it's being dragged — see `lensPreviewRef` above for why
        // this lives here rather than inside `useViewportInteraction`.
        const currentLens = lensPreviewRef.current;
        const lastLens = lastNotifiedLensRef.current;
        if (
          currentLens &&
          (!lastLens ||
            currentLens.x !== lastLens.x ||
            currentLens.y !== lastLens.y ||
            currentLens.width !== lastLens.width ||
            currentLens.height !== lastLens.height)
        ) {
          lastNotifiedLensRef.current = currentLens;
          onLensChangeRef.current?.(currentLens);
        }

        // Same "at most once per frame, only if it moved" notify for the
        // tracker overlay's rect while it's being dragged.
        const currentTracker = trackerPreviewRef.current;
        const lastTracker = lastNotifiedTrackerRef.current;
        if (
          currentTracker &&
          (!lastTracker ||
            currentTracker.x !== lastTracker.x ||
            currentTracker.y !== lastTracker.y ||
            currentTracker.width !== lastTracker.width ||
            currentTracker.height !== lastTracker.height)
        ) {
          lastNotifiedTrackerRef.current = currentTracker;
          onTrackerRectChangeRef.current?.(currentTracker);
        }

        // Same "at most once per frame, only if it moved" notify for a
        // shape being placed — this is what lets the player screen track it
        // live via `setLivePreviewShape` (issue #1).
        const currentMeasurement = measurementPreviewRef.current;
        const lastMeasurement = lastNotifiedMeasurementRef.current;
        if (
          currentMeasurement &&
          (!lastMeasurement ||
            currentMeasurement.originX !== lastMeasurement.originX ||
            currentMeasurement.originY !== lastMeasurement.originY ||
            currentMeasurement.extentFeet !== lastMeasurement.extentFeet ||
            currentMeasurement.orientation !== lastMeasurement.orientation)
        ) {
          lastNotifiedMeasurementRef.current = currentMeasurement;
          onMeasurementPreviewChangeRef.current?.(currentMeasurement);
        } else if (!currentMeasurement && lastMeasurement) {
          lastNotifiedMeasurementRef.current = null;
          onMeasurementPreviewChangeRef.current?.(null);
        }

        // The DM's own "aim" cursor, broadcast only while the tool is armed
        // and nothing is being placed yet (a shape preview takes over once
        // there is one) — lets the player screen show where a placement is
        // about to start, before the origin is even clicked.
        const armed = measurementToolRef.current?.enabled;
        const currentCursor =
          armed && !currentMeasurement ? cursorMapPosRef.current : null;
        const lastCursor = lastNotifiedCursorRef.current;
        if (
          (currentCursor &&
            (!lastCursor ||
              currentCursor.x !== lastCursor.x ||
              currentCursor.y !== lastCursor.y)) ||
          (!currentCursor && lastCursor)
        ) {
          lastNotifiedCursorRef.current = currentCursor;
          onMeasurementCursorChangeRef.current?.(currentCursor);
        }
      });
    },
    [],
  );

  const canvasSizeRef = useCanvasSize(canvasRef, scheduleDraw);

  const media = useMapMedia({
    map,
    canvasSizeRef,
    currentViewportRef: viewportRef,
    onScheduleDraw: scheduleDraw,
    onMediaReady: ({ size, viewport: centered }) => {
      // `onScheduleDraw` (called by `useMapMedia` right after this) is what
      // eventually notifies `onViewportChange` — see `scheduleDraw` above.
      viewportRef.current = centered;
      setMapSize(size);
      onMediaDimensions?.(size);
    },
  });

  const fogMask = useFogMask({
    fog,
    mapWidth: mapSize.width,
    mapHeight: mapSize.height,
    onScheduleDraw: scheduleDraw,
  });

  const drawGrid = useGridOverlay();

  const { getVideo: getEffectVideo } = useSpellEffectVideoCache(scheduleDraw);

  const { calibrationPreviewRef, movingShapeIdRef } = useViewportInteraction({
    canvasRef,
    interactive,
    viewportRef,
    fogRef,
    fogToolRef,
    onFogStrokeBatch,
    calibrationActiveRef,
    onCalibrateClick,
    paintFogStroke: fogMask.paintStroke,
    lensLockedRef,
    lensRectRef,
    lensScreenSizeRef,
    lensPreviewRef,
    onLensChange,
    trackerRectRef,
    trackerPreviewRef,
    onTrackerRectChange,
    measurementToolRef,
    gridRef: gridSpecRef,
    measurementPreviewRef,
    onMeasurementConfirm,
    measurementShapesRef,
    selectedMeasurementShapeIdRef,
    onSelectMeasurementShape,
    onMeasurementShapeMoved,
    cursorMapPosRef,
    onScheduleDraw: scheduleDraw,
  });

  useEffect(() => {
    const drawScene = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const rect = canvasSizeRef.current;
      ctx.resetTransform();
      ctx.scale(rect.dpr, rect.dpr);

      ctx.fillStyle = backgroundColor ?? DEFAULT_BACKGROUND;
      ctx.fillRect(0, 0, rect.width, rect.height);

      const currentViewport = viewportRef.current;

      ctx.save();
      ctx.scale(currentViewport.zoom, currentViewport.zoom);
      ctx.translate(-currentViewport.x, -currentViewport.y);

      const drawable = media.drawableRef.current;
      if (drawable) ctx.drawImage(drawable, 0, 0);

      if (grid.visible) {
        drawGrid(ctx, currentViewport, rect.width, rect.height, grid);
      }

      const mask = fogMask.maskRef.current;
      if (fogRef.current?.enabled && mask) {
        ctx.save();
        ctx.globalAlpha = fogOpacity ?? DEFAULT_FOG_OPACITY;
        ctx.drawImage(mask, 0, 0);
        ctx.restore();
      }

      const tool = fogToolRef.current;
      const cursor = cursorMapPosRef.current;
      if (tool?.enabled && cursor) {
        const zoom = currentViewport.zoom || 1;
        const isReveal = tool.mode === 'reveal';

        ctx.save();
        ctx.strokeStyle = isReveal
          ? 'rgba(255, 255, 255, 0.85)'
          : 'rgba(30, 30, 30, 0.85)';
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([4 / zoom, 3 / zoom]);

        if (tool.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(cursor.x, cursor.y, tool.size, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeRect(
            cursor.x - tool.size,
            cursor.y - tool.size,
            tool.size * 2,
            tool.size * 2,
          );
        }
        ctx.setLineDash([]);

        ctx.globalAlpha = 0.12;
        ctx.fillStyle = isReveal
          ? 'rgba(255, 255, 255, 1)'
          : 'rgba(0, 0, 0, 1)';
        if (tool.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(cursor.x, cursor.y, tool.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(
            cursor.x - tool.size,
            cursor.y - tool.size,
            tool.size * 2,
            tool.size * 2,
          );
        }
        ctx.restore();
      }

      if (calibrationActiveRef.current && calibrationStartRef.current) {
        const start = calibrationStartRef.current;
        const current = calibrationPreviewRef.current ?? start;
        const left = Math.min(start.x, current.x);
        const right = Math.max(start.x, current.x);
        const top = Math.min(start.y, current.y);
        const bottom = Math.max(start.y, current.y);
        const zoom = currentViewport.zoom || 1;

        ctx.beginPath();
        ctx.rect(left, top, right - left, bottom - top);
        ctx.strokeStyle = 'rgba(111, 167, 255, 0.9)';
        ctx.lineWidth = 1 / zoom;
        ctx.setLineDash([8 / zoom, 6 / zoom]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(111, 167, 255, 0.08)';
        ctx.fill();

        const drawDot = (x: number, y: number) => {
          ctx.beginPath();
          ctx.arc(x, y, 4 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(111, 167, 255, 0.9)';
          ctx.fill();
        };
        drawDot(start.x, start.y);
        if (calibrationPreviewRef.current) drawDot(current.x, current.y);
      }

      const lens = lensPreviewRef.current ?? lensRectRef.current;
      if (lens) {
        const zoom = currentViewport.zoom || 1;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 70, 70, 0.9)';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([10 / zoom, 6 / zoom]);
        ctx.strokeRect(lens.x, lens.y, lens.width, lens.height);
        ctx.setLineDash([]);
        ctx.restore();
      }

      // `trackerRect` is only ever non-null while the Player Screen tab is
      // open (see `useMapCanvas`) — otherwise it would be clutter on a
      // canvas the DM is using for something else entirely.
      const tracker = trackerPreviewRef.current ?? trackerRectRef.current;
      if (tracker) {
        const zoom = currentViewport.zoom || 1;

        ctx.save();
        ctx.strokeStyle = 'rgba(90, 220, 180, 0.9)';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([6 / zoom, 4 / zoom]);
        ctx.strokeRect(tracker.x, tracker.y, tracker.width, tracker.height);
        ctx.setLineDash([]);
        ctx.restore();
      }

      const drawShapeFootprint = (
        footprint: ReturnType<typeof computeShapeFootprint>,
        color: string,
        dashed: boolean,
        highlighted: boolean,
      ) => {
        const zoom = currentViewport.zoom || 1;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = (highlighted ? 3.5 : 2) / zoom;
        if (dashed) ctx.setLineDash([8 / zoom, 6 / zoom]);

        if (footprint.kind === 'circle') {
          ctx.beginPath();
          ctx.arc(footprint.cx, footprint.cy, footprint.radius, 0, Math.PI * 2);
          ctx.globalAlpha = 0.15;
          ctx.fill();
          ctx.globalAlpha = 0.9;
          ctx.stroke();
        } else {
          ctx.beginPath();
          footprint.points.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
          });
          if (footprint.points.length > 2) {
            ctx.closePath();
            ctx.globalAlpha = 0.15;
            ctx.fill();
          }
          ctx.globalAlpha = 0.9;
          ctx.stroke();
        }
        ctx.setLineDash([]);

        if (highlighted) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 1 / zoom;
          ctx.setLineDash([3 / zoom, 3 / zoom]);
          ctx.globalAlpha = 0.9;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.restore();
      };

      const drawShapeLabel = (anchor: MapPoint, text: string) => {
        const zoom = currentViewport.zoom || 1;
        const fontSize = 12 / zoom;

        ctx.save();
        ctx.font = `${fontSize}px system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const paddingX = 4 / zoom;
        const paddingY = 2 / zoom;
        const offset = 6 / zoom;
        const metrics = ctx.measureText(text);
        const boxX = anchor.x + offset;
        const boxY = anchor.y;

        ctx.fillStyle = 'rgba(10, 10, 14, 0.75)';
        ctx.fillRect(
          boxX - paddingX,
          boxY - fontSize / 2 - paddingY,
          metrics.width + paddingX * 2,
          fontSize + paddingY * 2,
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillText(text, boxX, boxY);
        ctx.restore();
      };

      const drawEffectVideoFrame = (
        video: HTMLVideoElement,
        shape: MeasurementShapeInput,
      ) => {
        const bounds = computeShapeVideoBounds(shape, gridSpecRef.current);

        ctx.save();
        if (bounds.kind === 'circle') {
          ctx.drawImage(
            video,
            bounds.cx - bounds.radius,
            bounds.cy - bounds.radius,
            bounds.radius * 2,
            bounds.radius * 2,
          );
        } else {
          ctx.translate(shape.originX, shape.originY);
          ctx.rotate(bounds.rotation);
          ctx.drawImage(
            video,
            bounds.offsetX,
            bounds.offsetY,
            bounds.width,
            bounds.height,
          );
        }
        ctx.restore();
      };

      // Every committed shape, always visible — none of them are secret.
      // The one currently being dragged (if any) is skipped here; its live
      // position is drawn from the preview below instead, so it isn't
      // rendered twice. A shape placed from a spell that matched an
      // animated effect plays it once in place of the plain static
      // footprint, for as long as `isEffectPlaying` says so — this is also
      // what keeps `hasActiveEffect` (and so the self-rescheduled redraw
      // loop below) true while any clip is still running.
      let hasActiveEffect = false;
      const now = Date.now();

      for (const shape of measurementShapesRef.current) {
        if (shape.id === movingShapeIdRef.current) continue;

        let drewEffectFrame = false;

        if (shape.effectUrl && shape.effectStartedAtMs != null) {
          const entry = getEffectVideo(shape.effectUrl);
          const playing = isEffectPlaying({
            effectStartedAtMs: shape.effectStartedAtMs,
            nowMs: now,
            videoEnded: entry.video.ended,
            failed: entry.failed,
          });

          if (playing) {
            hasActiveEffect = true;
            // HAVE_CURRENT_DATA — the same readiness canvas drawImage
            // itself requires; still-loading and failed clips fall through
            // to the plain static shape below instead of drawing nothing.
            if (!entry.failed && entry.video.readyState >= 2) {
              drawEffectVideoFrame(entry.video, shape);
              drewEffectFrame = true;
            }
          }
        }

        if (!drewEffectFrame) {
          drawShapeFootprint(
            computeShapeFootprint(shape, gridSpecRef.current),
            shape.color,
            false,
            shape.id === selectedMeasurementShapeIdRef.current,
          );
        }
        drawShapeLabel(
          computeShapeLabelAnchor(shape, gridSpecRef.current),
          buildMeasurementLabelText(shape),
        );
      }

      // The shape currently being aimed or dragged: this DM's own drag
      // takes priority (updated synchronously), falling back to the live
      // session field for a non-interactive canvas (the player screen)
      // tracking it over SSE.
      const previewShape = measurementPreviewRef.current;
      const remotePreview = livePreviewShapeRef.current;
      if (previewShape) {
        const movingShapeId = movingShapeIdRef.current;
        const movingOriginal = movingShapeId
          ? measurementShapesRef.current.find(
              candidate => candidate.id === movingShapeId,
            )
          : undefined;
        const color =
          movingOriginal?.color ??
          measurementToolRef.current?.color ??
          '#6fa7ff';
        const label = movingOriginal
          ? movingOriginal.label
          : measurementToolRef.current?.label;

        drawShapeFootprint(
          computeShapeFootprint(previewShape, gridSpecRef.current),
          color,
          true,
          Boolean(movingShapeId),
        );
        drawShapeLabel(
          computeShapeLabelAnchor(previewShape, gridSpecRef.current),
          buildMeasurementLabelText({
            extentFeet: previewShape.extentFeet,
            label,
          }),
        );
      } else if (remotePreview) {
        drawShapeFootprint(
          computeShapeFootprint(remotePreview, gridSpecRef.current),
          remotePreview.color,
          true,
          false,
        );
        drawShapeLabel(
          computeShapeLabelAnchor(remotePreview, gridSpecRef.current),
          buildMeasurementLabelText(remotePreview),
        );
      } else {
        // Nothing is being aimed locally or remotely yet — show where a
        // placement is about to start, before the origin is even clicked.
        const remoteCursor = measurementCursorRef.current;
        if (remoteCursor) {
          const zoom = currentViewport.zoom || 1;
          const r = 8 / zoom;

          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 1.5 / zoom;
          ctx.beginPath();
          ctx.moveTo(remoteCursor.x - r, remoteCursor.y);
          ctx.lineTo(remoteCursor.x + r, remoteCursor.y);
          ctx.moveTo(remoteCursor.x, remoteCursor.y - r);
          ctx.lineTo(remoteCursor.x, remoteCursor.y + r);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(remoteCursor.x, remoteCursor.y, r * 0.6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.restore();

      if (media.isLoadingRef.current) {
        const progress = media.progressRef.current;
        const barWidth = Math.min(rect.width * 0.5, 280);
        const barHeight = 3;
        const barX = (rect.width - barWidth) / 2;
        const barY = rect.height / 2 + 24;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.font = '13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          progress > 0
            ? `Loading map… ${Math.round(progress * 100)}%`
            : 'Loading map…',
          rect.width / 2,
          rect.height / 2,
        );

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        if (progress > 0) {
          ctx.fillStyle = 'rgba(111, 167, 255, 0.85)';
          ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        }
      }

      // Self-rescheduling: unlike every other reason this canvas redraws
      // (a pointer event, a prop change), an effect clip keeps playing on
      // its own timeline with nothing else prompting a new frame. Keeps
      // requesting the next one for exactly as long as `isEffectPlaying`
      // says a clip still is, then goes idle again on its own.
      if (hasActiveEffect) scheduleDraw();
    };

    drawRef.current = drawScene;
    // Never draw synchronously here — always through the RAF scheduler, so a
    // prop change (e.g. a new `grid` object identity) can never force more
    // than one real canvas draw per animation frame.
    scheduleDraw();
  }, [
    backgroundColor,
    calibrationPreviewRef,
    canvasSizeRef,
    cursorMapPosRef,
    drawGrid,
    fogMask.maskRef,
    fogOpacity,
    fogRef,
    getEffectVideo,
    grid,
    gridSpecRef,
    lensPreviewRef,
    lensRectRef,
    livePreviewShape,
    livePreviewShapeRef,
    measurementCursor,
    measurementCursorRef,
    measurementPreviewRef,
    measurementShapes,
    measurementShapesRef,
    measurementTool,
    measurementToolRef,
    media.drawableRef,
    media.isLoadingRef,
    media.progressRef,
    movingShapeIdRef,
    scheduleDraw,
    selectedMeasurementShapeId,
    selectedMeasurementShapeIdRef,
    trackerPreviewRef,
    trackerRectRef,
    // Read inside `drawScene` only via `viewportRef`, never directly — but a
    // non-interactive canvas (the player screen) has no pointer handlers of
    // its own to call `scheduleDraw()` when the viewport changes, so this has
    // to be listed anyway purely to trigger that redraw. Without it, the
    // player screen never repaints when the DM moves the lens.
    viewport,
  ]);

  return (
    <Wrapper>
      <Canvas ref={canvasRef} aria-label="Map canvas" />
      {!map && (
        <EmptyOverlay>No map selected. Preview one from Maps.</EmptyOverlay>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const Canvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
`;

const EmptyOverlay = styled.p`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: ${props => props.theme.space.md};
  text-align: center;
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
  pointer-events: none;
`;
