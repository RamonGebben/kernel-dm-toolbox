'use client';

import { EmptyState } from '~/atoms/EmptyState';
import { CheckboxRow } from '~/atoms/CheckboxRow';
import { FieldRow } from '~/atoms/FieldRow';
import { Tabs, type TabOption } from '~/atoms/Tabs';
import { OpenPlayerScreenLink } from '~/molecules/OpenPlayerScreenLink';
import { Stack } from '~/atoms/Stack';
import { Footer } from '~/organisms/SessionControlsPanel/components/SessionControlsView/components/Footer';
import { MutedCaption } from '~/atoms/MutedCaption';

export type PlayerScreenMode = 'map' | 'tracker' | 'both';
export type PlayerScreenOrientation = 'auto' | 'landscape' | 'portrait';

const MODE_OPTIONS: ReadonlyArray<TabOption<PlayerScreenMode>> = [
  { value: 'map', label: 'Map' },
  { value: 'tracker', label: 'Tracker' },
  { value: 'both', label: 'Both' },
];

const ORIENTATION_OPTIONS: ReadonlyArray<TabOption<PlayerScreenOrientation>> = [
  { value: 'auto', label: 'Auto' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'portrait', label: 'Portrait' },
];

export interface SessionControlsViewProps {
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
  trackerShowConditions: boolean;
  onTrackerShowConditionsChange: (show: boolean) => void;
}

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
  trackerShowConditions,
  onTrackerShowConditionsChange,
}: SessionControlsViewProps) => {
  const trackerToggles: ReadonlyArray<{
    id: string;
    label: string;
    checked: boolean;
    onChange: (show: boolean) => void;
  }> = [
    {
      id: 'tracker-show-initiative',
      label: 'Show initiative',
      checked: trackerShowInitiative,
      onChange: onTrackerShowInitiativeChange,
    },
    {
      id: 'tracker-show-name',
      label: 'Show name',
      checked: trackerShowName,
      onChange: onTrackerShowNameChange,
    },
    {
      id: 'tracker-show-health',
      label: 'Show health',
      checked: trackerShowHealth,
      onChange: onTrackerShowHealthChange,
    },
    {
      id: 'tracker-show-conditions',
      label: 'Show conditions',
      checked: trackerShowConditions,
      onChange: onTrackerShowConditionsChange,
    },
  ];

  return (
    <Stack $gap="m">
      <Stack $gap="s">
        <MutedCaption>Player screen shows</MutedCaption>
        <Tabs
          options={MODE_OPTIONS}
          value={mode}
          onChange={onModeChange}
          label="Player screen mode"
        />
      </Stack>

      <Stack $gap="s">
        <MutedCaption>Orientation</MutedCaption>
        <Tabs
          options={ORIENTATION_OPTIONS}
          value={orientation}
          onChange={onOrientationChange}
          label="Player screen orientation"
        />
      </Stack>

      {mode === 'both' && (
        <Stack $gap="s">
          <MutedCaption>Tracker overlay</MutedCaption>

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
              onChange={event =>
                onTrackerScaleChange(Number(event.target.value))
              }
            />
          </FieldRow>

          {trackerToggles.map(toggle => (
            <CheckboxRow key={toggle.id}>
              <input
                id={toggle.id}
                type="checkbox"
                checked={toggle.checked}
                onChange={event => toggle.onChange(event.target.checked)}
              />
              <label htmlFor={toggle.id}>{toggle.label}</label>
            </CheckboxRow>
          ))}
        </Stack>
      )}

      {!hasActiveMap && (
        <EmptyState
          title="No map is live yet"
          description="Preview a map from the Maps tab before positioning the player view."
        />
      )}
      <Footer>
        <OpenPlayerScreenLink />
      </Footer>
    </Stack>
  );
};
