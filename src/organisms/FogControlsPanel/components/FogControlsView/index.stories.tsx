import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { FogControlsView } from '~/organisms/FogControlsPanel/components/FogControlsView';

const meta = {
  title: 'Organisms/FogControlsPanel/FogControlsView',
  component: FogControlsView,
  args: {
    hasSelectedMap: true,
    isEnabled: true,
    dmOpacity: 0.6,
    playerOpacity: 0.9,
    brush: {
      enabled: false,
      mode: 'reveal',
      shape: 'circle',
      size: 60,
      softness: 0.4,
    },
    onToggleEnabled: fn(),
    onReset: fn(),
    onRevealAll: fn(),
    onDmOpacityChange: fn(),
    onPlayerOpacityChange: fn(),
    onBrushChange: fn(),
  },
} satisfies Meta<typeof FogControlsView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoMapSelected: Story = {
  args: { hasSelectedMap: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No map selected')).toBeVisible();
  },
};

export const FogDisabled: Story = {
  args: { isEnabled: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.queryByRole('button', { name: 'Fog brush' }),
    ).not.toBeInTheDocument();
  },
};

export const FogEnabled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Fog brush' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Reveal all' }),
    ).toBeVisible();
  },
};

export const StartingTheBrush: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Fog brush' }));

    await expect(args.onBrushChange).toHaveBeenCalledWith({ enabled: true });
  },
};

export const TogglingFog: Story = {
  args: { isEnabled: false },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByLabelText('Fog of war'));

    await expect(args.onToggleEnabled).toHaveBeenCalledWith(true);
  },
};

export const ChangingBrushMode: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.selectOptions(canvas.getByLabelText('Mode'), 'cover');

    await expect(args.onBrushChange).toHaveBeenCalledWith({ mode: 'cover' });
  },
};

export const RevealingAll: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Reveal all' }));

    await expect(args.onRevealAll).toHaveBeenCalledOnce();
  },
};

export const ChangingPlayerOpacity: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    fireEvent.change(canvas.getByLabelText('Player view opacity'), {
      target: { value: '0.3' },
    });

    await expect(args.onPlayerOpacityChange).toHaveBeenCalledWith(0.3);
    // The DM's own opacity is independent.
    await expect(args.onDmOpacityChange).not.toHaveBeenCalled();
  },
};

export const Resetting: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));

    await expect(args.onReset).toHaveBeenCalledOnce();
  },
};
