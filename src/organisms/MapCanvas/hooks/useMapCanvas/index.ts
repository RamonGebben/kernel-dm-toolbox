'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useMapToolStore } from '~/stores/mapTool';
import type { Viewport } from '~/utils/mapViewport';
import {
  computeLensRect,
  rectToPlayerViewport,
  type LensRect,
} from '~/utils/mapLens';
import {
  computeTrackerRect,
  trackerRectToAnchor,
} from '~/utils/trackerOverlayRect';
import type {
  CalibrationPoint,
  MapCanvasFogStroke,
  MapCanvasMeasurementShape,
} from '~/organisms/MapCanvas/components/MapCanvasView';
import {
  buildSpellEffectUrl,
  type MeasurementShapeInput,
} from '~/utils/mapMeasurement';

/**
 * How long to wait after the DM's pan/zoom settles before persisting it.
 * Persisted so the DM's view survives a restart, but never on a per-frame
 * cadence — that would hammer the database on every pan/zoom gesture, the
 * same class of problem the canvas's rendering perf fix addressed.
 */
const DM_VIEWPORT_PERSIST_DEBOUNCE_MS = 800;

/**
 * The two-click calibration rectangle becomes a square grid cell: its side is
 * the larger of the rectangle's width/height, anchored at its top-left
 * corner. Pure so the geometry is testable without a canvas.
 */
export const computeGridCalibration = (
  start: CalibrationPoint,
  end: CalibrationPoint,
): { gridCellSize: number; gridOriginX: number; gridOriginY: number } => ({
  gridCellSize: Math.max(
    4,
    Math.round(Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y))),
  ),
  gridOriginX: Math.min(start.x, end.x),
  gridOriginY: Math.min(start.y, end.y),
});

export const useMapCanvas = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const calibrationActive = useMapToolStore(state => state.calibrationActive);
  const calibrationStart = useMapToolStore(state => state.calibrationStart);
  const setCalibrationStart = useMapToolStore(
    state => state.setCalibrationStart,
  );
  const cancelCalibration = useMapToolStore(state => state.cancelCalibration);
  const fogBrush = useMapToolStore(state => state.fogBrush);
  const trackerEditingActive = useMapToolStore(
    state => state.activePanel === 'session',
  );
  const measurementTool = useMapToolStore(state => state.measurementTool);
  const selectedMeasurementShapeId = useMapToolStore(
    state => state.selectedMeasurementShapeId,
  );
  const setSelectedMeasurementShapeId = useMapToolStore(
    state => state.setSelectedMeasurementShapeId,
  );

  const session = useQuery(trpc.maps.getSession.queryOptions());
  const activeMapId = session.data?.activeMapId ?? null;

  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const hasInitializedViewportRef = useRef(false);
  useEffect(() => {
    if (hasInitializedViewportRef.current || !session.data) return;
    hasInitializedViewportRef.current = true;
    setViewport({
      x: session.data.dmViewportX,
      y: session.data.dmViewportY,
      zoom: session.data.dmViewportZoom,
    });
  }, [session.data]);

  const map = useQuery({
    ...trpc.maps.get.queryOptions({ id: activeMapId ?? '' }),
    enabled: activeMapId !== null,
  });
  const mapId = map.data?.id;

  const invalidateMap = () =>
    queryClient.invalidateQueries({ queryKey: trpc.maps.get.queryKey() });
  const invalidateSession = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.maps.getSession.queryKey(),
    });
  const invalidateMeasurementShapes = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.maps.listMeasurementShapes.queryKey(),
    });

  const reportDimensions = useMutation(
    trpc.maps.reportDimensions.mutationOptions({ onSuccess: invalidateMap }),
  );
  const setGridCalibration = useMutation(
    trpc.maps.setGridCalibration.mutationOptions({ onSuccess: invalidateMap }),
  );
  const applyFogStrokes = useMutation(
    trpc.maps.applyFogStrokes.mutationOptions({ onSuccess: invalidateMap }),
  );
  const setDmViewport = useMutation(trpc.maps.setDmViewport.mutationOptions());
  const setPlayerViewport = useMutation(
    trpc.maps.setPlayerViewport.mutationOptions({
      onSuccess: invalidateSession,
    }),
  );
  const setTrackerOverlay = useMutation(
    trpc.maps.setTrackerOverlay.mutationOptions({
      onSuccess: invalidateSession,
    }),
  );

  const measurementShapesQuery = useQuery({
    ...trpc.maps.listMeasurementShapes.queryOptions({ mapId: mapId ?? '' }),
    enabled: mapId !== undefined,
  });
  const createMeasurementShape = useMutation(
    trpc.maps.createMeasurementShape.mutationOptions({
      onSuccess: invalidateMeasurementShapes,
    }),
  );
  const removeMeasurementShape = useMutation(
    trpc.maps.removeMeasurementShape.mutationOptions({
      onSuccess: invalidateMeasurementShapes,
    }),
  );
  const updateMeasurementShape = useMutation(
    trpc.maps.updateMeasurementShape.mutationOptions({
      onSuccess: invalidateMeasurementShapes,
    }),
  );
  // No `onSuccess` invalidation: these are per-frame live broadcasts, not a
  // change the DM's own screen needs to refetch anything over — only the
  // player screen (over SSE) ever reads them.
  const setLivePreviewShape = useMutation(
    trpc.maps.setLivePreviewShape.mutationOptions(),
  );
  const setMeasurementCursor = useMutation(
    trpc.maps.setMeasurementCursor.mutationOptions(),
  );

  // Stable prop identities: none of these need to be recreated on every
  // render just because, say, an unrelated background refetch happened —
  // the canvas's draw effect treats a new object/function identity as "this
  // needs to redraw."
  const handleCalibrateClick = useCallback(
    (point: CalibrationPoint) => {
      if (!calibrationStart) {
        setCalibrationStart(point);
        return;
      }

      if (mapId) {
        setGridCalibration.mutate({
          id: mapId,
          ...computeGridCalibration(calibrationStart, point),
        });
      }

      cancelCalibration();
    },
    [
      calibrationStart,
      mapId,
      setCalibrationStart,
      setGridCalibration,
      cancelCalibration,
    ],
  );

  const onFogStrokeBatch = useCallback(
    (strokes: MapCanvasFogStroke[]) => {
      if (mapId) applyFogStrokes.mutate({ id: mapId, strokes });
    },
    [mapId, applyFogStrokes],
  );

  const onMediaDimensions = useCallback(
    (size: { width: number; height: number }) => {
      if (mapId) {
        reportDimensions.mutate({
          id: mapId,
          nativeWidth: size.width,
          nativeHeight: size.height,
        });
      }
    },
    [mapId, reportDimensions],
  );

  const dmViewportDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  useEffect(
    () => () => {
      if (dmViewportDebounceRef.current) {
        clearTimeout(dmViewportDebounceRef.current);
      }
    },
    [],
  );

  const handleViewportChange = useCallback(
    (next: Viewport) => {
      setViewport(next);

      if (dmViewportDebounceRef.current) {
        clearTimeout(dmViewportDebounceRef.current);
      }
      dmViewportDebounceRef.current = setTimeout(() => {
        setDmViewport.mutate(next);
      }, DM_VIEWPORT_PERSIST_DEBOUNCE_MS);
    },
    [setDmViewport],
  );

  const gridVisible = session.data?.gridVisible ?? true;
  const gridColor = session.data?.gridColor ?? '#e0e5f5';
  const gridOpacity = session.data?.gridOpacity ?? 0.18;
  const gridCellSize = map.data?.gridCellSize ?? 0;
  const gridOriginX = map.data?.gridOriginX ?? 0;
  const gridOriginY = map.data?.gridOriginY ?? 0;
  const grid = useMemo(
    () => ({
      visible: gridVisible,
      color: gridColor,
      opacity: gridOpacity,
      cellSize: gridCellSize,
      originX: gridOriginX,
      originY: gridOriginY,
    }),
    [
      gridVisible,
      gridColor,
      gridOpacity,
      gridCellSize,
      gridOriginX,
      gridOriginY,
    ],
  );

  const lensRect = useMemo<LensRect | null>(() => {
    if (!session.data) return null;

    return computeLensRect(
      {
        x: session.data.playerViewportX,
        y: session.data.playerViewportY,
        zoom: session.data.playerViewportZoom,
      },
      session.data.playerScreenWidth,
      session.data.playerScreenHeight,
    );
  }, [session.data]);

  const lensLocked = session.data?.isViewportLocked ?? false;
  const lensScreenSize = session.data
    ? {
        width: session.data.playerScreenWidth,
        height: session.data.playerScreenHeight,
      }
    : undefined;

  // Fires far more often than a typical mutation — live while the DM drags
  // or wheel-zooms the lens (see MapCanvasView/useViewportInteraction) — a
  // deliberate, accepted increase in write volume for this one interaction,
  // matching the original app's live feel. Trivial in absolute terms for a
  // single DM on a local network.
  const onLensChange = useCallback(
    (rect: LensRect) => {
      if (!session.data) return;

      setPlayerViewport.mutate(
        rectToPlayerViewport(rect, session.data.playerScreenWidth),
      );
    },
    [session.data, setPlayerViewport],
  );

  // `null` outside the Player Screen tab — a single source of truth that
  // makes the tracker rect neither drawn nor hit-testable/draggable then,
  // rather than gating drawing and interaction separately in two places.
  const trackerRect = useMemo<LensRect | null>(() => {
    if (!session.data || !lensRect || !trackerEditingActive) return null;

    return computeTrackerRect(
      lensRect,
      session.data.trackerOverlayAnchorX,
      session.data.trackerOverlayAnchorY,
      session.data.trackerOverlayScale,
    );
  }, [session.data, lensRect, trackerEditingActive]);

  // Same live, RAF-throttled cadence as `onLensChange` — see its comment.
  const onTrackerRectChange = useCallback(
    (rect: LensRect) => {
      if (!lensRect) return;

      setTrackerOverlay.mutate(trackerRectToAnchor(rect, lensRect));
    },
    [lensRect, setTrackerOverlay],
  );

  const measurementShapes = useMemo<MapCanvasMeasurementShape[]>(
    () =>
      (measurementShapesQuery.data ?? []).map(shape => ({
        id: shape.id,
        shapeType: shape.shapeType,
        originX: shape.originX,
        originY: shape.originY,
        extentFeet: shape.extentFeet,
        orientation: shape.orientation,
        color: shape.color,
        label: shape.label,
        effectUrl: shape.sourceSpellSlug
          ? buildSpellEffectUrl(shape.sourceSpellSlug)
          : null,
        effectStartedAtMs: shape.effectPlaybackStartedAt?.getTime() ?? null,
        effectLoops: shape.effectLoops,
      })),
    [measurementShapesQuery.data],
  );

  // The DB write for a placed shape is the confirming second click; the
  // live-drag frames leading up to it are only ever broadcast, never
  // individually persisted (see `onMeasurementPreviewChange`).
  const handleMeasurementConfirm = useCallback(
    (shape: MeasurementShapeInput) => {
      if (!mapId) return;

      createMeasurementShape.mutate({
        mapId,
        shapeType: shape.shapeType,
        originX: shape.originX,
        originY: shape.originY,
        extentFeet: shape.extentFeet,
        orientation: shape.orientation,
        color: measurementTool.color,
        label: measurementTool.label.trim() || null,
        sourceSpellSlug: measurementTool.sourceSpellSlug,
      });
    },
    [mapId, createMeasurementShape, measurementTool],
  );

  // Live while a shape is being aimed — the same cadence `onLensChange`
  // uses — so the player screen tracks it before the confirming click.
  const handleMeasurementPreviewChange = useCallback(
    (shape: MeasurementShapeInput | null) => {
      if (!mapId) return;

      setLivePreviewShape.mutate({
        preview: shape
          ? {
              mapId,
              shapeType: shape.shapeType,
              originX: shape.originX,
              originY: shape.originY,
              extentFeet: shape.extentFeet,
              orientation: shape.orientation,
              color: measurementTool.color,
              label: measurementTool.label.trim() || null,
            }
          : null,
      });
    },
    [mapId, setLivePreviewShape, measurementTool],
  );

  // Live while the tool is armed and the cursor is over the canvas, before
  // there's a shape preview to take over — the same cadence as
  // `handleMeasurementPreviewChange`.
  const handleMeasurementCursorChange = useCallback(
    (point: { x: number; y: number } | null) => {
      if (!mapId) return;

      setMeasurementCursor.mutate({
        cursor: point ? { mapId, x: point.x, y: point.y } : null,
      });
    },
    [mapId, setMeasurementCursor],
  );

  const handleSelectMeasurementShape = useCallback(
    (id: string | null) => setSelectedMeasurementShapeId(id),
    [setSelectedMeasurementShapeId],
  );

  // Fired once, on release, at the end of a drag-to-move.
  const handleMeasurementShapeMoved = useCallback(
    (id: string, origin: { x: number; y: number }) => {
      updateMeasurementShape.mutate({
        id,
        originX: origin.x,
        originY: origin.y,
      });
    },
    [updateMeasurementShape],
  );

  const handleRemoveMeasurementShape = useCallback(
    (id: string) => {
      removeMeasurementShape.mutate({ id });
      if (selectedMeasurementShapeId === id) {
        setSelectedMeasurementShapeId(null);
      }
    },
    [
      removeMeasurementShape,
      selectedMeasurementShapeId,
      setSelectedMeasurementShapeId,
    ],
  );

  // A shape selected on the previous map has nothing to highlight once the
  // DM switches to a different one.
  const previousMapIdRef = useRef(mapId);
  useEffect(() => {
    if (previousMapIdRef.current !== mapId) {
      previousMapIdRef.current = mapId;
      setSelectedMeasurementShapeId(null);
    }
  }, [mapId, setSelectedMeasurementShapeId]);

  return {
    map: map.data
      ? {
          fileUrl: map.data.fileUrl,
          kind: map.data.kind as 'image' | 'video',
          nativeWidth: map.data.nativeWidth,
          nativeHeight: map.data.nativeHeight,
        }
      : null,
    viewport,
    onViewportChange: handleViewportChange,
    grid,
    backgroundColor: session.data?.gridBackgroundColor,
    fog: map.data?.fog,
    fogOpacity: map.data?.fog.opacityDm,
    fogTool: fogBrush,
    onFogStrokeBatch,
    calibrationActive,
    calibrationStart,
    onCalibrateClick: handleCalibrateClick,
    onMediaDimensions,
    lensRect,
    lensLocked,
    lensScreenSize,
    onLensChange,
    trackerRect,
    onTrackerRectChange,
    measurementShapes,
    measurementTool: mapId
      ? {
          enabled: measurementTool.enabled,
          shapeType: measurementTool.shapeType,
          color: measurementTool.color,
          presetExtentFeet: measurementTool.presetExtentFeet,
          label: measurementTool.label.trim() || null,
        }
      : undefined,
    onMeasurementConfirm: handleMeasurementConfirm,
    onMeasurementPreviewChange: handleMeasurementPreviewChange,
    onMeasurementCursorChange: handleMeasurementCursorChange,
    selectedMeasurementShapeId,
    onSelectMeasurementShape: handleSelectMeasurementShape,
    onMeasurementShapeMoved: handleMeasurementShapeMoved,
    onRemoveMeasurementShape: handleRemoveMeasurementShape,
  };
};
