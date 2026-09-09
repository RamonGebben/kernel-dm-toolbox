'use client';

import { FogControlsView } from '~/organisms/FogControlsPanel/components/FogControlsView';
import { useFogControls } from '~/organisms/FogControlsPanel/hooks/useFogControls';

/**
 * Connected boundary: owns the previewed map's query, its fog mutations, and
 * the brush tool's ephemeral settings, and delegates every pixel to
 * `FogControlsView`.
 */
export const FogControlsPanel = () => {
  const fog = useFogControls();

  return (
    <FogControlsView
      hasSelectedMap={fog.hasSelectedMap}
      isEnabled={fog.isEnabled}
      dmOpacity={fog.dmOpacity}
      playerOpacity={fog.playerOpacity}
      brush={fog.brush}
      onToggleEnabled={fog.onToggleEnabled}
      onReset={fog.onReset}
      onRevealAll={fog.onRevealAll}
      onDmOpacityChange={fog.onDmOpacityChange}
      onPlayerOpacityChange={fog.onPlayerOpacityChange}
      onBrushChange={fog.onBrushChange}
    />
  );
};
