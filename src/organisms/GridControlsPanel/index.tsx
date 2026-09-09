'use client';

import { GridControlsView } from '~/organisms/GridControlsPanel/components/GridControlsView';
import { useGridControls } from '~/organisms/GridControlsPanel/hooks/useGridControls';

/**
 * Connected boundary: owns the previewed map's query and the calibration
 * flow's on/off switch, and delegates every pixel to `GridControlsView`.
 */
export const GridControlsPanel = () => {
  const grid = useGridControls();

  return (
    <GridControlsView
      hasSelectedMap={grid.hasSelectedMap}
      cellSize={grid.cellSize}
      calibrationActive={grid.calibrationActive}
      onStartCalibration={grid.onStartCalibration}
      onCancelCalibration={grid.onCancelCalibration}
      onGridCellSizeChange={grid.onGridCellSizeChange}
      gridVisible={grid.gridVisible}
      gridColor={grid.gridColor}
      gridOpacity={grid.gridOpacity}
      gridBackgroundColor={grid.gridBackgroundColor}
      onGridVisibleChange={grid.onGridVisibleChange}
      onGridColorChange={grid.onGridColorChange}
      onGridOpacityChange={grid.onGridOpacityChange}
      onGridBackgroundColorChange={grid.onGridBackgroundColorChange}
    />
  );
};
