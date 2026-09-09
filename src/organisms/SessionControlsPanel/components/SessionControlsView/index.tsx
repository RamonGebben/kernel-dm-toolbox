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
