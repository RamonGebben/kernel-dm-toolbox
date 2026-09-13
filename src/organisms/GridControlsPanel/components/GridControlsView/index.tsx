'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { CheckboxRow, FieldRow } from '~/atoms/FormControls';

export type GridControlsViewProps = {
  hasSelectedMap: boolean;
  cellSize: number | null;
  calibrationActive: boolean;
  onStartCalibration: () => void;
  onCancelCalibration: () => void;
  onGridCellSizeChange: (cellSize: number) => void;
  gridVisible: boolean;
  gridColor: string;
  gridOpacity: number;
  gridBackgroundColor: string;
  onGridVisibleChange: (visible: boolean) => void;
  onGridColorChange: (color: string) => void;
  onGridOpacityChange: (opacity: number) => void;
  onGridBackgroundColorChange: (color: string) => void;
};

/**
 * Grid calibration and display for the live map. Presentational — every
 * state is reachable from a story because nothing here fetches.
 *
 * Calibration (cell size/origin) is per-map; visibility/color/opacity/
 * background are session-wide (`map_sessions`) since they apply to whatever
 * map is live, not any one map in particular — both live in this one tab
 * since both are, from the DM's chair, just "grid settings."
 */
export const GridControlsView = ({
  hasSelectedMap,
  cellSize,
  calibrationActive,
  onStartCalibration,
  onCancelCalibration,
  onGridCellSizeChange,
  gridVisible,
  gridColor,
  gridOpacity,
  gridBackgroundColor,
  onGridVisibleChange,
  onGridColorChange,
  onGridOpacityChange,
  onGridBackgroundColorChange,
}: GridControlsViewProps) => {
  if (!hasSelectedMap) {
    return (
      <EmptyState
        title="No map selected"
        description="Preview a map from the Maps tab to calibrate its grid."
      />
    );
  }

  return (
    <Wrapper>
      <Status>
        {cellSize === null
          ? 'Not calibrated'
          : `Grid calibrated: ${cellSize}px per cell`}
      </Status>

      {calibrationActive ? (
        <Instructions>
          <p>
            Click one corner of a grid cell on the map, then the opposite
            corner.
          </p>
          <Button variant="ghost" size="sm" onClick={onCancelCalibration}>
            Cancel
          </Button>
        </Instructions>
      ) : (
        <Button variant="secondary" size="sm" onClick={onStartCalibration}>
          {cellSize === null ? 'Calibrate grid' : 'Recalibrate grid'}
        </Button>
      )}

      <FieldRow>
        <label htmlFor="grid-cell-size">Grid size (px)</label>
        <input
          id="grid-cell-size"
          type="number"
          min={4}
          max={512}
          step={1}
          value={cellSize ?? ''}
          onChange={event => {
            const value = Number(event.target.value);
            if (!Number.isNaN(value) && value > 0) onGridCellSizeChange(value);
          }}
        />
      </FieldRow>

      <CheckboxRow>
        <input
          id="grid-visible"
          type="checkbox"
          checked={gridVisible}
          onChange={event => onGridVisibleChange(event.target.checked)}
        />
        <label htmlFor="grid-visible">Show grid</label>
      </CheckboxRow>

      <FieldRow>
        <label htmlFor="grid-color">Line color</label>
        <input
          id="grid-color"
          type="color"
          value={gridColor}
          onChange={event => onGridColorChange(event.target.value)}
        />
      </FieldRow>

      <FieldRow>
        <label htmlFor="grid-opacity">Line opacity</label>
        <input
          id="grid-opacity"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={gridOpacity}
          onChange={event => onGridOpacityChange(Number(event.target.value))}
        />
      </FieldRow>

      <FieldRow>
        <label htmlFor="grid-background-color">Background color</label>
        <input
          id="grid-background-color"
          type="color"
          value={gridBackgroundColor}
          onChange={event => onGridBackgroundColorChange(event.target.value)}
        />
      </FieldRow>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
`;

const Status = styled.p`
  margin: 0;
  font-family: ${props => props.theme.font.mono};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Instructions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};

  p {
    margin: 0;
    font-size: ${props => props.theme.fontSize.sm};
    color: ${props => props.theme.color.textPrimary};
  }
`;
