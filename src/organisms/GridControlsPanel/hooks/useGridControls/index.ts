'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useMapToolStore } from '~/stores/mapTool';

export const useGridControls = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const calibrationActive = useMapToolStore(state => state.calibrationActive);
  const startCalibration = useMapToolStore(state => state.startCalibration);
  const cancelCalibration = useMapToolStore(state => state.cancelCalibration);

  const session = useQuery(trpc.maps.getSession.queryOptions());
  const activeMapId = session.data?.activeMapId ?? null;

  const map = useQuery({
    ...trpc.maps.get.queryOptions({ id: activeMapId ?? '' }),
    enabled: activeMapId !== null,
  });

  const setGridCalibration = useMutation(
    trpc.maps.setGridCalibration.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: trpc.maps.get.queryKey() }),
    }),
  );

  const setGridDisplay = useMutation(
    trpc.maps.setGridDisplay.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.maps.getSession.queryKey(),
        }),
    }),
  );

  return {
    hasSelectedMap: activeMapId !== null,
    cellSize: map.data?.gridCellSize ?? null,
    calibrationActive,
    onStartCalibration: startCalibration,
    onCancelCalibration: cancelCalibration,
    onGridCellSizeChange: (cellSize: number) => {
      if (!map.data) return;
      setGridCalibration.mutate({
        id: map.data.id,
        gridCellSize: cellSize,
        gridOriginX: map.data.gridOriginX,
        gridOriginY: map.data.gridOriginY,
      });
    },
    gridVisible: session.data?.gridVisible ?? true,
    gridColor: session.data?.gridColor ?? '#e0e5f5',
    gridOpacity: session.data?.gridOpacity ?? 0.18,
    gridBackgroundColor: session.data?.gridBackgroundColor ?? '#0c0d11',
    onGridVisibleChange: (visible: boolean) =>
      setGridDisplay.mutate({ visible }),
    onGridColorChange: (color: string) => setGridDisplay.mutate({ color }),
    onGridOpacityChange: (opacity: number) =>
      setGridDisplay.mutate({ opacity }),
    onGridBackgroundColorChange: (backgroundColor: string) =>
      setGridDisplay.mutate({ backgroundColor }),
  };
};
