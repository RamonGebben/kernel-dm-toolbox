'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import type { FogBrushMode, FogBrushShape } from '~/stores/mapTool';

export type FogControlsBrush = {
  enabled: boolean;
  mode: FogBrushMode;
  shape: FogBrushShape;
  size: number;
  softness: number;
};

export type FogControlsViewProps = {
  hasSelectedMap: boolean;
  isEnabled: boolean;
  dmOpacity: number;
  playerOpacity: number;
  brush: FogControlsBrush;
  onToggleEnabled: (enabled: boolean) => void;
  onReset: () => void;
  onRevealAll: () => void;
  onDmOpacityChange: (opacity: number) => void;
  onPlayerOpacityChange: (opacity: number) => void;
  onBrushChange: (patch: Partial<FogControlsBrush>) => void;
};

/**
 * Fog of war for the previewed map. Presentational — every state is
 * reachable from a story because nothing here fetches.
 */
export const FogControlsView = ({
  hasSelectedMap,
  isEnabled,
  dmOpacity,
  playerOpacity,
  brush,
  onToggleEnabled,
  onReset,
  onRevealAll,
  onDmOpacityChange,
  onPlayerOpacityChange,
  onBrushChange,
}: FogControlsViewProps) => {
  if (!hasSelectedMap) {
    return (
      <EmptyState
        title="No map selected"
        description="Preview a map from the Maps tab to control its fog."
      />
    );
  }

  return (
    <Wrapper>
      <CheckboxRow>
        <input
          id="fog-enabled"
          type="checkbox"
          checked={isEnabled}
          onChange={event => onToggleEnabled(event.target.checked)}
        />
        <label htmlFor="fog-enabled">Fog of war</label>
      </CheckboxRow>

      {isEnabled && (
        <>
          <Button
            variant={brush.enabled ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onBrushChange({ enabled: !brush.enabled })}
          >
            {brush.enabled ? 'Stop brush' : 'Fog brush'}
          </Button>

          <FieldRow>
            <label htmlFor="fog-mode">Mode</label>
            <Select
              id="fog-mode"
              value={brush.mode}
              onChange={event =>
                onBrushChange({ mode: event.target.value as FogBrushMode })
              }
            >
              <option value="reveal">Reveal</option>
              <option value="cover">Cover</option>
            </Select>
          </FieldRow>

          <FieldRow>
            <label htmlFor="fog-shape">Shape</label>
            <Select
              id="fog-shape"
              value={brush.shape}
              onChange={event =>
                onBrushChange({ shape: event.target.value as FogBrushShape })
              }
            >
              <option value="circle">Circle</option>
              <option value="square">Square</option>
            </Select>
          </FieldRow>

          <FieldRow>
            <label htmlFor="fog-size">Brush size</label>
            <input
              id="fog-size"
              type="range"
              min={10}
              max={300}
              value={brush.size}
              onChange={event =>
                onBrushChange({ size: Number(event.target.value) })
              }
            />
          </FieldRow>

          <FieldRow>
            <label htmlFor="fog-softness">Softness</label>
            <input
              id="fog-softness"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={brush.softness}
              onChange={event =>
                onBrushChange({ softness: Number(event.target.value) })
              }
            />
          </FieldRow>

          <FieldRow>
            <label htmlFor="fog-opacity-dm">DM view opacity</label>
            <input
              id="fog-opacity-dm"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={dmOpacity}
              onChange={event =>
                onDmOpacityChange(Number(event.target.value))
              }
            />
          </FieldRow>

          <FieldRow>
            <label htmlFor="fog-opacity-player">Player view opacity</label>
            <input
              id="fog-opacity-player"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={playerOpacity}
              onChange={event =>
                onPlayerOpacityChange(Number(event.target.value))
              }
            />
          </FieldRow>

          <ButtonRow>
            <Button variant="ghost" size="sm" onClick={onRevealAll}>
              Reveal all
            </Button>
            <Button variant="ghost" size="sm" onClick={onReset}>
              Reset
            </Button>
          </ButtonRow>
        </>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};

  label {
    color: ${props => props.theme.color.textPrimary};
    font-size: ${props => props.theme.fontSize.sm};
  }
`;

const FieldRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};

  label {
    font-size: ${props => props.theme.fontSize.sm};
    color: ${props => props.theme.color.textMuted};
  }
`;

const Select = styled.select`
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.sm};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;
