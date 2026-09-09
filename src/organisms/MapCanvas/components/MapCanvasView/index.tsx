'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { type Viewport } from '~/utils/mapViewport';
import type { LensRect } from '~/utils/mapLens';
import { useCanvasSize } from '~/organisms/MapCanvas/hooks/useCanvasSize';
import { useMapMedia } from '~/organisms/MapCanvas/hooks/useMapMedia';
import { useFogMask } from '~/organisms/MapCanvas/hooks/useFogMask';
import { useGridOverlay } from '~/organisms/MapCanvas/hooks/useGridOverlay';
import { useViewportInteraction } from '~/organisms/MapCanvas/hooks/useViewportInteraction';

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

  const { cursorMapPosRef, calibrationPreviewRef } = useViewportInteraction({
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
    grid,
    lensPreviewRef,
    lensRectRef,
    media.drawableRef,
    media.isLoadingRef,
    media.progressRef,
    scheduleDraw,
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
