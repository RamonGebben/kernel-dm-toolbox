'use client';

import styled from 'styled-components';
import { EmptyState } from '~/atoms/EmptyState';
import { Tabs, type TabOption } from '~/atoms/Tabs';

export type PlayerScreenMode = 'map' | 'tracker' | 'both';
export type PlayerScreenOrientation = 'auto' | 'landscape' | 'portrait';

const MODE_OPTIONS: readonly TabOption<PlayerScreenMode>[] = [
  { value: 'map', label: 'Map' },
  { value: 'tracker', label: 'Tracker' },
  { value: 'both', label: 'Both' },
];

const ORIENTATION_OPTIONS: readonly TabOption<PlayerScreenOrientation>[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'portrait', label: 'Portrait' },
];

export type SessionControlsViewProps = {
  hasActiveMap: boolean;
  mode: PlayerScreenMode;
  onModeChange: (mode: PlayerScreenMode) => void;
  orientation: PlayerScreenOrientation;
  onOrientationChange: (orientation: PlayerScreenOrientation) => void;
  trackerOpacity: number;
  onTrackerOpacityChange: (opacity: number) => void;
  trackerScale: number;
  onTrackerScaleChange: (scale: number) => void;
  trackerShowInitiative: boolean;
  onTrackerShowInitiativeChange: (show: boolean) => void;
  trackerShowName: boolean;
  onTrackerShowNameChange: (show: boolean) => void;
  trackerShowHealth: boolean;
  onTrackerShowHealthChange: (show: boolean) => void;
};

/**
 * Controls for what the player screen shows and how it's oriented.
 * Presentational — every state is reachable from a story because nothing
 * here fetches.
 */
export const SessionControlsView = ({
  hasActiveMap,
  mode,
  onModeChange,
  orientation,
  onOrientationChange,
  trackerOpacity,
  onTrackerOpacityChange,
  trackerScale,
  onTrackerScaleChange,
  trackerShowInitiative,
  onTrackerShowInitiativeChange,
  trackerShowName,
  onTrackerShowNameChange,
  trackerShowHealth,
  onTrackerShowHealthChange,
}: SessionControlsViewProps) => (
  <Wrapper>
    <FieldGroup>
      <Label>Player screen shows</Label>
      <Tabs
        options={MODE_OPTIONS}
        value={mode}
        onChange={onModeChange}
        label="Player screen mode"
      />
    </FieldGroup>

    <FieldGroup>
      <Label>Orientation</Label>
      <Tabs
        options={ORIENTATION_OPTIONS}
        value={orientation}
        onChange={onOrientationChange}
        label="Player screen orientation"
      />
    </FieldGroup>

    {mode === 'both' && (
      <FieldGroup>
        <Label>Tracker overlay</Label>

        <FieldRow>
          <label htmlFor="tracker-opacity">Opacity</label>
          <input
            id="tracker-opacity"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={trackerOpacity}
            onChange={event =>
              onTrackerOpacityChange(Number(event.target.value))
            }
          />
        </FieldRow>

        <FieldRow>
          <label htmlFor="tracker-scale">Size</label>
          <input
            id="tracker-scale"
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={trackerScale}
            onChange={event => onTrackerScaleChange(Number(event.target.value))}
          />
        </FieldRow>

        <CheckboxRow>
          <input
            id="tracker-show-initiative"
            type="checkbox"
            checked={trackerShowInitiative}
            onChange={event =>
              onTrackerShowInitiativeChange(event.target.checked)
            }
          />
          <label htmlFor="tracker-show-initiative">Show initiative</label>
        </CheckboxRow>

        <CheckboxRow>
          <input
            id="tracker-show-name"
            type="checkbox"
            checked={trackerShowName}
            onChange={event => onTrackerShowNameChange(event.target.checked)}
          />
          <label htmlFor="tracker-show-name">Show name</label>
        </CheckboxRow>

        <CheckboxRow>
          <input
            id="tracker-show-health"
            type="checkbox"
            checked={trackerShowHealth}
            onChange={event => onTrackerShowHealthChange(event.target.checked)}
          />
          <label htmlFor="tracker-show-health">Show health</label>
        </CheckboxRow>
      </FieldGroup>
    )}

    {!hasActiveMap && (
      <EmptyState
        title="No map is live yet"
        description="Preview a map from the Maps tab before positioning the player view."
      />
    )}
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.lg};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const Label = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
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

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};

  label {
    color: ${props => props.theme.color.textPrimary};
    font-size: ${props => props.theme.fontSize.sm};
  }
`;
