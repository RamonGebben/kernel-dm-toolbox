'use client';

import { MeasurementControlsView } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView';
import { useMeasurementControls } from '~/organisms/MeasurementControlsPanel/hooks/useMeasurementControls';

/**
 * Connected boundary: owns the previewed map's placed shapes, the armed
 * placement tool's settings, and the spell-lookup search, and delegates
 * every pixel to `MeasurementControlsView`.
 */
export const MeasurementControlsPanel = () => {
  const measurement = useMeasurementControls();

  return (
    <MeasurementControlsView
      hasSelectedMap={measurement.hasSelectedMap}
      tool={measurement.tool}
      onToolChange={measurement.onToolChange}
      shapes={measurement.shapes}
      onRemoveShape={measurement.onRemoveShape}
      selectedShapeId={measurement.selectedShapeId}
      onSelectShape={measurement.onSelectShape}
      spellSearch={measurement.spellSearch}
      onSpellSearchChange={measurement.onSpellSearchChange}
      spellOptions={measurement.spellOptions}
      onSelectSpell={measurement.onSelectSpell}
      onClearSpell={measurement.onClearSpell}
    />
  );
};
