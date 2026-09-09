'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import {
  SIZE_PRESETS_FEET,
  type MeasurementShapeType,
} from '~/utils/mapMeasurement';

export type MeasurementControlsTool = {
  enabled: boolean;
  shapeType: MeasurementShapeType;
  color: string;
  label: string;
  sourceSpellSlug: string | null;
  presetExtentFeet: number | null;
};

export type MeasurementControlsShape = {
  id: string;
  shapeType: MeasurementShapeType;
  extentFeet: number;
  label: string | null;
  color: string;
};

export type MeasurementControlsSpellOption = {
  slug: string;
  name: string;
  shapeType: MeasurementShapeType;
  extentFeet: number;
};

export type MeasurementControlsViewProps = {
  hasSelectedMap: boolean;
  tool: MeasurementControlsTool;
  onToolChange: (patch: Partial<MeasurementControlsTool>) => void;
  shapes: MeasurementControlsShape[];
  onRemoveShape: (id: string) => void;
  spellSearch: string;
  onSpellSearchChange: (search: string) => void;
  spellOptions: MeasurementControlsSpellOption[];
  onSelectSpell: (slug: string) => void;
  onClearSpell: () => void;
};

const SHAPE_LABELS: Record<MeasurementShapeType, string> = {
  ruler: 'Ruler',
  circle: 'Circle / sphere',
  cone: 'Cone',
  line: 'Line',
  cube: 'Cube / square',
};

/**
 * The ruler and spell-area template tool for the previewed map.
 * Presentational — every state is reachable from a story because nothing
 * here fetches.
 */
export const MeasurementControlsView = ({
  hasSelectedMap,
  tool,
  onToolChange,
  shapes,
  onRemoveShape,
  spellSearch,
  onSpellSearchChange,
  spellOptions,
  onSelectSpell,
  onClearSpell,
}: MeasurementControlsViewProps) => {
  if (!hasSelectedMap) {
    return (
      <EmptyState
        title="No map selected"
        description="Preview a map from the Maps tab to measure on it."
      />
    );
  }

  return (
    <Wrapper>
      <Button
        variant={tool.enabled ? 'primary' : 'secondary'}
        size="sm"
        onClick={() => onToolChange({ enabled: !tool.enabled })}
      >
        {tool.enabled ? 'Stop placing' : 'Place on canvas'}
      </Button>

      {tool.enabled && (
        <Instructions>
          {tool.presetExtentFeet
            ? 'Click the canvas to place it.'
            : 'Click the canvas to set the origin, then click again to set its size.'}
        </Instructions>
      )}

      <FieldRow>
        <label htmlFor="measurement-shape">Shape</label>
        <Select
          id="measurement-shape"
          value={tool.shapeType}
          onChange={event =>
            onToolChange({
              shapeType: event.target.value as MeasurementShapeType,
            })
          }
        >
          {Object.entries(SHAPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FieldRow>

      <FieldRow>
        <label htmlFor="measurement-color">Color</label>
        <input
          id="measurement-color"
          type="color"
          value={tool.color}
          onChange={event => onToolChange({ color: event.target.value })}
        />
      </FieldRow>

      <FieldRow>
        <label htmlFor="measurement-label">Label (optional)</label>
        <input
          id="measurement-label"
          type="text"
          maxLength={80}
          value={tool.label}
          onChange={event => onToolChange({ label: event.target.value })}
        />
      </FieldRow>

      {tool.shapeType !== 'ruler' && (
        <FieldRow>
          <label>Size</label>
          <PresetRow>
            <PresetButton
              type="button"
              $isActive={tool.presetExtentFeet === null}
              onClick={() => onToolChange({ presetExtentFeet: null })}
            >
              Custom
            </PresetButton>
            {SIZE_PRESETS_FEET.map(feet => (
              <PresetButton
                key={feet}
                type="button"
                $isActive={tool.presetExtentFeet === feet}
                onClick={() => onToolChange({ presetExtentFeet: feet })}
              >
                {feet} ft
              </PresetButton>
            ))}
          </PresetRow>
        </FieldRow>
      )}

      <FieldRow>
        <label htmlFor="measurement-spell-search">Spell lookup</label>
        <input
          id="measurement-spell-search"
          type="text"
          placeholder="Search spells…"
          value={spellSearch}
          onChange={event => onSpellSearchChange(event.target.value)}
        />
      </FieldRow>

      {tool.sourceSpellSlug && (
        <SpellBadge>
          From {tool.label || 'a spell'}
          <Button variant="ghost" size="sm" onClick={onClearSpell}>
            Clear
          </Button>
        </SpellBadge>
      )}

      {spellSearch.trim().length > 0 && (
        <SpellList>
          {spellOptions.length === 0 && (
            <SpellListEmpty>No area spells match.</SpellListEmpty>
          )}
          {spellOptions.map(option => (
            <SpellOption
              key={option.slug}
              type="button"
              onClick={() => onSelectSpell(option.slug)}
            >
              {option.name}
              <SpellOptionMeta>
                {SHAPE_LABELS[option.shapeType]} · {option.extentFeet} ft
              </SpellOptionMeta>
            </SpellOption>
          ))}
        </SpellList>
      )}

      <ShapeListHeading>Placed ({shapes.length})</ShapeListHeading>
      {shapes.length === 0 ? (
        <Muted>Nothing placed on this map yet.</Muted>
      ) : (
        <ShapeList>
          {shapes.map(shape => (
            <ShapeRow key={shape.id}>
              <ShapeSwatch $color={shape.color} />
              <ShapeRowLabel>
                {shape.label || SHAPE_LABELS[shape.shapeType]}
                <ShapeRowMeta>
                  {SHAPE_LABELS[shape.shapeType]} · {shape.extentFeet} ft
                </ShapeRowMeta>
              </ShapeRowLabel>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveShape(shape.id)}
              >
                Remove
              </Button>
            </ShapeRow>
          ))}
        </ShapeList>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
`;

const Instructions = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textPrimary};
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

const PresetRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.space.xs};
`;

const PresetButton = styled.button<{ $isActive: boolean }>`
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  border: 1px solid
    ${props =>
      props.$isActive ? props.theme.color.accent : props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  background: ${props =>
    props.$isActive ? props.theme.color.accentMuted : props.theme.color.canvas};
  color: ${props => props.theme.color.textPrimary};
  font-size: ${props => props.theme.fontSize.sm};
  cursor: pointer;
`;

const SpellBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-size: ${props => props.theme.fontSize.sm};
`;

const SpellList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  max-height: 10rem;
  overflow-y: auto;
`;

const SpellListEmpty = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const SpellOption = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.canvas};
  color: ${props => props.theme.color.textPrimary};
  font-size: ${props => props.theme.fontSize.sm};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme.color.surfaceRaised};
  }
`;

const SpellOptionMeta = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const ShapeListHeading = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  letter-spacing: 0.04em;
  color: ${props => props.theme.color.textMuted};
`;

const Muted = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const ShapeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
`;

const ShapeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const ShapeSwatch = styled.span<{ $color: string }>`
  width: 0.75rem;
  height: 0.75rem;
  flex: none;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.$color};
`;

const ShapeRowLabel = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  color: ${props => props.theme.color.textPrimary};
  font-size: ${props => props.theme.fontSize.sm};
`;

const ShapeRowMeta = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
