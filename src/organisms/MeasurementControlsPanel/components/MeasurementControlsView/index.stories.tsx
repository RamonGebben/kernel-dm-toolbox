import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fireEvent, fn, within } from 'storybook/test';
import { MeasurementControlsView } from '~/organisms/MeasurementControlsPanel/components/MeasurementControlsView';

const meta = {
  title: 'Organisms/MeasurementControlsPanel/MeasurementControlsView',
  component: MeasurementControlsView,
  args: {
    hasSelectedMap: true,
    tool: {
      enabled: false,
      shapeType: 'circle',
      color: '#6fa7ff',
      label: '',
      sourceSpellSlug: null,
      presetExtentFeet: null,
    },
    onToolChange: fn(),
    labelScale: 1,
    onLabelScaleChange: fn(),
    shapes: [],
    onRemoveShape: fn(),
    selectedShapeId: null,
    onSelectShape: fn(),
    spellSearch: '',
    onSpellSearchChange: fn(),
    spellOptions: [],
    onSelectSpell: fn(),
    onClearSpell: fn(),
  },
} satisfies Meta<typeof MeasurementControlsView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoMapSelected: Story = {
  args: { hasSelectedMap: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No map selected')).toBeVisible();
  },
};

export const Idle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Place on canvas')).toBeVisible();
    await expect(
      canvas.getByText('Nothing placed on this map yet.'),
    ).toBeVisible();
  },
};

export const ArmedFreeDrag: Story = {
  args: { tool: { ...meta.args.tool, enabled: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText(/Click the canvas to set the origin/),
    ).toBeVisible();
  },
};

export const ArmedWithPreset: Story = {
  args: {
    tool: { ...meta.args.tool, enabled: true, presetExtentFeet: 20 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('Click the canvas to place it.'),
    ).toBeVisible();
  },
};

export const ArmedWithPresetAndAOrientation: Story = {
  args: {
    tool: {
      ...meta.args.tool,
      enabled: true,
      shapeType: 'cone',
      presetExtentFeet: 20,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText(/then move to aim and click again to confirm/),
    ).toBeVisible();
  },
};

export const RulerHasNoSizePresets: Story = {
  args: { tool: { ...meta.args.tool, shapeType: 'ruler' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText('Custom')).not.toBeInTheDocument();
  },
};

export const PickingASizePreset: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    fireEvent.click(canvas.getByText('20 ft'));

    await expect(args.onToolChange).toHaveBeenCalledWith({
      presetExtentFeet: 20,
    });
  },
};

export const PickingALabelScale: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Session-wide, so it's reachable even with the placement tool
    // disarmed — unlike the Size presets, which only mean something for
    // the next shape about to be placed.
    fireEvent.click(canvas.getByText('2x'));

    await expect(args.onLabelScaleChange).toHaveBeenCalledWith(2);
  },
};

export const SpellLookupResults: Story = {
  args: {
    spellSearch: 'fireball',
    spellOptions: [
      {
        slug: 'srd-2024_fireball',
        name: 'Fireball',
        shapeType: 'circle',
        extentFeet: 20,
        color: '#ef5350',
      },
    ],
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    fireEvent.click(canvas.getByText('Fireball'));

    await expect(args.onSelectSpell).toHaveBeenCalledWith('srd-2024_fireball');
  },
};

export const SpellLookupResultWithNoDamageType: Story = {
  args: {
    spellSearch: 'shield',
    spellOptions: [
      {
        slug: 'srd-2024_shield',
        name: 'Shield',
        shapeType: 'circle',
        extentFeet: 5,
        color: null,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // No damage type to auto-assign a colour from, so no swatch is shown —
    // picking this spell leaves the tool's current colour untouched.
    await expect(canvas.getByText('Shield')).toBeVisible();
  },
};

export const SpellSourceBadge: Story = {
  args: {
    tool: {
      ...meta.args.tool,
      label: 'Fireball',
      sourceSpellSlug: 'srd-2024_fireball',
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('From Fireball')).toBeVisible();

    fireEvent.click(canvas.getByText('Clear'));
    await expect(args.onClearSpell).toHaveBeenCalledOnce();
  },
};

const placedShapes = [
  {
    id: 'shape-1',
    shapeType: 'cone' as const,
    extentFeet: 15,
    label: 'Burning Hands',
    color: '#ff8a5c',
  },
  {
    id: 'shape-2',
    shapeType: 'ruler' as const,
    extentFeet: 30,
    label: null,
    color: '#6fa7ff',
  },
];

export const PlacedShapes: Story = {
  args: { shapes: placedShapes },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Placed (2)')).toBeVisible();
    await expect(canvas.getByText('Burning Hands')).toBeVisible();
    // Disarmed with shapes on the board: the drag-to-move hint shows.
    await expect(
      canvas.getByText('Drag a placed shape on the canvas to move it.'),
    ).toBeVisible();

    fireEvent.click(canvas.getAllByText('Remove')[0]!);
    await expect(args.onRemoveShape).toHaveBeenCalledWith('shape-1');
  },
};

export const ClickingARowSelectsIt: Story = {
  args: { shapes: placedShapes },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    fireEvent.click(canvas.getByText('Burning Hands'));

    await expect(args.onSelectShape).toHaveBeenCalledWith('shape-1');
    // The Remove button is a separate control nested in the row — clicking
    // it must not also select the row.
    await expect(args.onRemoveShape).not.toHaveBeenCalled();
  },
};

export const SelectedRowIsHighlighted: Story = {
  args: { shapes: placedShapes, selectedShapeId: 'shape-1' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Clicking the already-selected row toggles it off.
    fireEvent.click(canvas.getByText('Burning Hands'));
    await expect(args.onSelectShape).toHaveBeenCalledWith(null);
  },
};
