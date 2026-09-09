import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { GridControlsView } from '~/organisms/GridControlsPanel/components/GridControlsView';

const meta = {
  title: 'Organisms/GridControlsPanel/GridControlsView',
  component: GridControlsView,
  args: {
    hasSelectedMap: true,
    cellSize: null,
    calibrationActive: false,
    onStartCalibration: fn(),
    onCancelCalibration: fn(),
    onGridCellSizeChange: fn(),
    gridVisible: true,
    gridColor: '#e0e5f5',
    gridOpacity: 0.18,
    gridBackgroundColor: '#0c0d11',
    onGridVisibleChange: fn(),
    onGridColorChange: fn(),
    onGridOpacityChange: fn(),
    onGridBackgroundColorChange: fn(),
  },
} satisfies Meta<typeof GridControlsView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoMapSelected: Story = {
  args: { hasSelectedMap: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No map selected')).toBeVisible();
  },
};

export const Uncalibrated: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Not calibrated')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Calibrate grid' }),
    ).toBeVisible();
  },
};

export const Calibrated: Story = {
  args: { cellSize: 70 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('Grid calibrated: 70px per cell'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Recalibrate grid' }),
    ).toBeVisible();
  },
};

export const StartingCalibration: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Calibrate grid' }),
    );

    await expect(args.onStartCalibration).toHaveBeenCalledOnce();
  },
};

export const CalibratingInProgress: Story = {
  args: { calibrationActive: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText(/Click one corner of a grid cell/),
    ).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(args.onCancelCalibration).toHaveBeenCalledOnce();
  },
};

export const TogglingGridVisibility: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByLabelText('Show grid'));

    await expect(args.onGridVisibleChange).toHaveBeenCalledWith(false);
  },
};

export const TypingAGridSize: Story = {
  args: { cellSize: 48 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    fireEvent.change(canvas.getByLabelText('Grid size (px)'), {
      target: { value: '64' },
    });

    await expect(args.onGridCellSizeChange).toHaveBeenCalledWith(64);
  },
};
