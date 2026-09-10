'use client';

import { MapCanvasView } from '~/organisms/MapCanvas/components/MapCanvasView';
import { useMapCanvas } from '~/organisms/MapCanvas/hooks/useMapCanvas';

/**
 * Connected boundary: owns the live map session's query and the mutations
 * that fall out of the canvas (grid calibration, fog strokes, reported
 * native size, the DM's own viewport, the player-view lens), and delegates
 * every pixel to `MapCanvasView`, which is where the stories live.
 *
 * `viewport` stays local React state during interaction — the DM's drag is
 * never round-tripped through the server per frame — but is seeded from and
 * debounce-persisted to `map_sessions` so it survives a restart, the same
 * way `combatants` are server-authoritative for the tracker.
 */
export const MapCanvas = () => {
  const canvas = useMapCanvas();

  return (
    <MapCanvasView
      map={canvas.map}
      viewport={canvas.viewport}
      interactive
      onViewportChange={canvas.onViewportChange}
      grid={canvas.grid}
      backgroundColor={canvas.backgroundColor}
      fog={canvas.fog}
      fogOpacity={canvas.fogOpacity}
      fogTool={canvas.fogTool}
      onFogStrokeBatch={canvas.onFogStrokeBatch}
      calibrationActive={canvas.calibrationActive}
      calibrationStart={canvas.calibrationStart}
      onCalibrateClick={canvas.onCalibrateClick}
      onMediaDimensions={canvas.onMediaDimensions}
      lensRect={canvas.lensRect}
      lensLocked={canvas.lensLocked}
      lensScreenSize={canvas.lensScreenSize}
      onLensChange={canvas.onLensChange}
      trackerRect={canvas.trackerRect}
      onTrackerRectChange={canvas.onTrackerRectChange}
      measurementShapes={canvas.measurementShapes}
      measurementLabelScale={canvas.measurementLabelScale}
      measurementTool={canvas.measurementTool}
      onMeasurementConfirm={canvas.onMeasurementConfirm}
      onMeasurementPreviewChange={canvas.onMeasurementPreviewChange}
      onMeasurementCursorChange={canvas.onMeasurementCursorChange}
      selectedMeasurementShapeId={canvas.selectedMeasurementShapeId}
      onSelectMeasurementShape={canvas.onSelectMeasurementShape}
      onMeasurementShapeMoved={canvas.onMeasurementShapeMoved}
    />
  );
};
