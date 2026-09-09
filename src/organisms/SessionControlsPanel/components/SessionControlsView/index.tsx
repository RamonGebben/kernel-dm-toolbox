'use client';

import styled from 'styled-components';
import { EmptyState } from '~/atoms/EmptyState';
import { Tabs, type TabOption } from '~/atoms/Tabs';

export type PlayerScreenMode = 'map' | 'tracker' | 'both';

const MODE_OPTIONS: readonly TabOption<PlayerScreenMode>[] = [
  { value: 'map', label: 'Map' },
  { value: 'tracker', label: 'Tracker' },
  { value: 'both', label: 'Both' },
];

export type SessionControlsViewProps = {
  hasActiveMap: boolean;
  mode: PlayerScreenMode;
  onModeChange: (mode: PlayerScreenMode) => void;
};

/**
 * Controls for what the player screen shows. Presentational — every state
 * is reachable from a story because nothing here fetches.
 */
export const SessionControlsView = ({
  hasActiveMap,
  mode,
  onModeChange,
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
