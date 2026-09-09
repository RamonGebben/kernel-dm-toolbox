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
    shapes: [],
    onRemoveShape: fn(),
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

export const SpellLookupResults: Story = {
  args: {
    spellSearch: 'fireball',
    spellOptions: [
      {
        slug: 'srd-2024_fireball',
        name: 'Fireball',
        shapeType: 'circle',
        extentFeet: 20,
      },
    ],
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    fireEvent.click(canvas.getByText('Fireball'));

    await expect(args.onSelectSpell).toHaveBeenCalledWith('srd-2024_fireball');
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

export const PlacedShapes: Story = {
  args: {
    shapes: [
      {
        id: 'shape-1',
        shapeType: 'cone',
        extentFeet: 15,
        label: 'Burning Hands',
        color: '#ff8a5c',
      },
      {
        id: 'shape-2',
        shapeType: 'ruler',
        extentFeet: 30,
        label: null,
        color: '#6fa7ff',
      },
    ],
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Placed (2)')).toBeVisible();
    await expect(canvas.getByText('Burning Hands')).toBeVisible();

    fireEvent.click(canvas.getAllByText('Remove')[0]!);
    await expect(args.onRemoveShape).toHaveBeenCalledWith('shape-1');
  },
};
