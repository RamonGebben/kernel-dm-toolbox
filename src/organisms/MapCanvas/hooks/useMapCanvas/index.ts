'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useMapToolStore } from '~/stores/mapTool';
import type { Viewport } from '~/utils/mapViewport';
import { computeLensRect, rectToPlayerViewport, type LensRect } from '~/utils/mapLens';
import type {
  CalibrationPoint,
  MapCanvasFogStroke,
} from '~/organisms/MapCanvas/components/MapCanvasView';

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
    trpc.maps.setPlayerViewport.mutationOptions({ onSuccess: invalidateSession }),
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
    [calibrationStart, mapId, setCalibrationStart, setGridCalibration, cancelCalibration],
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
    [gridVisible, gridColor, gridOpacity, gridCellSize, gridOriginX, gridOriginY],
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
  };
};
