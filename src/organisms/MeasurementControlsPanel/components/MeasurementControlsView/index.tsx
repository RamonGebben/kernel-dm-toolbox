'use client';

import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { FieldRow } from '~/atoms/FieldRow';
import { Select } from '~/atoms/Select';
import { TextInput } from '~/atoms/TextInput';
import {
  SIZE_PRESETS_FEET,
  TV_READABILITY_SCALE_PRESETS,
  type MeasurementShapeType,
} from '~/utils/mapMeasurement';
import { Stack } from '~/atoms/Stack';
import { Instructions } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/Instructions';
import { PresetRow } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/PresetRow';
import { PresetButton } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/PresetButton';
import { SpellBadge } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/SpellBadge';
import { SpellBadgeLabel } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/SpellBadgeLabel';
import { SpellList } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/SpellList';
import { MutedNote } from '~/atoms/MutedNote';
import { SpellOption } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/SpellOption';
import { SpellOptionHeader } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/SpellOptionHeader';
import { MutedCaption } from '~/atoms/MutedCaption';
import { ShapeListHeading } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/ShapeListHeading';
import { ShapeRow } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/ShapeRow';
import { ShapeSelectButton } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/ShapeSelectButton';
import { ShapeSwatch } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/ShapeSwatch';
import { ShapeRowLabel } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView/components/ShapeRowLabel';

export interface MeasurementControlsTool {
  enabled: boolean;
  shapeType: MeasurementShapeType;
  color: string;
  label: string;
  sourceSpellSlug: string | null;
  presetExtentFeet: number | null;
}

export interface MeasurementControlsShape {
  id: string;
  shapeType: MeasurementShapeType;
  extentFeet: number;
  label: string | null;
  color: string;
}

export interface MeasurementControlsSpellOption {
  slug: string;
  name: string;
  shapeType: MeasurementShapeType;
  extentFeet: number;
  /** Auto-assigned from the spell's damage type (acid green, fire red, …) —
   * null for a spell with no damage type, which keeps the tool's current
   * colour rather than overwriting it with a guess. */
  color: string | null;
}

export interface MeasurementControlsViewProps {
  hasSelectedMap: boolean;
  tool: MeasurementControlsTool;
  onToolChange: (patch: Partial<MeasurementControlsTool>) => void;
  /** Session-wide, unlike everything else here: applies to every label
   * already on the board, on both the DM and player canvases, not just the
   * next shape placed. */
  labelScale: number;
  onLabelScaleChange: (scale: number) => void;
  /** Session-wide, same reasoning as `labelScale`: scales the "aim" reticle
   * shown on the player screen before a shape exists to preview. */
  cursorScale: number;
  onCursorScaleChange: (scale: number) => void;
  shapes: Array<MeasurementControlsShape>;
  onRemoveShape: (id: string) => void;
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  spellSearch: string;
  onSpellSearchChange: (search: string) => void;
  spellOptions: Array<MeasurementControlsSpellOption>;
  onSelectSpell: (slug: string) => void;
  onClearSpell: () => void;
}

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
  labelScale,
  onLabelScaleChange,
  cursorScale,
  onCursorScaleChange,
  shapes,
  onRemoveShape,
  selectedShapeId,
  onSelectShape,
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
    <Stack>
      <Button
        variant={tool.enabled ? 'primary' : 'secondary'}
        size="sm"
        onClick={() => onToolChange({ enabled: !tool.enabled })}
      >
        {tool.enabled ? 'Stop placing' : 'Place on canvas'}
      </Button>

      {tool.enabled ? (
        <Instructions>
          {tool.presetExtentFeet
            ? tool.shapeType === 'circle'
              ? 'Click the canvas to place it.'
              : 'Click the canvas to set the origin, then move to aim and click again to confirm.'
            : 'Click the canvas to set the origin, then click again to set its size.'}
        </Instructions>
      ) : (
        shapes.length > 0 && (
          <Instructions>
            Drag a placed shape on the canvas to move it.
          </Instructions>
        )
      )}

      <ScalePresetField
        label="Label size"
        value={labelScale}
        onChange={onLabelScaleChange}
      />

      <ScalePresetField
        label="Aim cursor size"
        value={cursorScale}
        onChange={onCursorScaleChange}
      />

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
        <TextInput
          id="measurement-label"
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
        <TextInput
          id="measurement-spell-search"
          placeholder="Search spells…"
          value={spellSearch}
          onChange={event => onSpellSearchChange(event.target.value)}
        />
      </FieldRow>

      {tool.sourceSpellSlug && (
        <SpellBadge>
          <SpellBadgeLabel>
            <ShapeSwatch $color={tool.color} />
            From {tool.label || 'a spell'}
          </SpellBadgeLabel>
          <Button variant="ghost" size="sm" onClick={onClearSpell}>
            Clear
          </Button>
        </SpellBadge>
      )}

      {spellSearch.trim().length > 0 && (
        <SpellList>
          {spellOptions.length === 0 && (
            <MutedNote>No area spells match.</MutedNote>
          )}
          {spellOptions.map(option => (
            <SpellOption
              key={option.slug}
              type="button"
              onClick={() => onSelectSpell(option.slug)}
            >
              <SpellOptionHeader>
                {option.color && <ShapeSwatch $color={option.color} />}
                {option.name}
              </SpellOptionHeader>
              <MutedCaption>
                {SHAPE_LABELS[option.shapeType]} · {option.extentFeet} ft
              </MutedCaption>
            </SpellOption>
          ))}
        </SpellList>
      )}

      <ShapeListHeading>Placed ({shapes.length})</ShapeListHeading>
      {shapes.length === 0 ? (
        <MutedNote>Nothing placed on this map yet.</MutedNote>
      ) : (
        <Stack $gap="xs">
          {shapes.map(shape => {
            const isSelected = shape.id === selectedShapeId;
            return (
              <ShapeRow key={shape.id} $isSelected={isSelected}>
                <ShapeSelectButton
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectShape(isSelected ? null : shape.id)}
                >
                  <ShapeSwatch $color={shape.color} />
                  <ShapeRowLabel>
                    {shape.label || SHAPE_LABELS[shape.shapeType]}
                    <MutedCaption>
                      {SHAPE_LABELS[shape.shapeType]} · {shape.extentFeet} ft
                    </MutedCaption>
                  </ShapeRowLabel>
                </ShapeSelectButton>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveShape(shape.id)}
                >
                  Remove
                </Button>
              </ShapeRow>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};

/** Both `labelScale` and `cursorScale` are a label + a row of multiplier
 * presets over the same `TV_READABILITY_SCALE_PRESETS` set — the only thing
 * that differs between them is which value they read and which handler they
 * call. */
interface ScalePresetFieldProps {
  label: string;
  value: number;
  onChange: (scale: number) => void;
}

const ScalePresetField = ({
  label,
  value,
  onChange,
}: ScalePresetFieldProps) => (
  <FieldRow>
    <label>{label}</label>
    <PresetRow>
      {TV_READABILITY_SCALE_PRESETS.map(scale => (
        <PresetButton
          key={scale}
          type="button"
          $isActive={value === scale}
          onClick={() => onChange(scale)}
        >
          {scale}x
        </PresetButton>
      ))}
    </PresetRow>
  </FieldRow>
);
