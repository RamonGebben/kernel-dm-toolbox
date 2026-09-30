import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { MapRow } from '~/molecules/MapRow';

const meta = {
  title: 'Molecules/MapRow',
  component: MapRow,
  args: {
    name: 'The Sunken Crypt',
    kind: 'image',
    hasGridCalibration: true,
    folderOptions: [
      { id: 'f1', name: 'Dungeons' },
      { id: 'f2', name: 'Towns' },
    ],
    currentFolderId: null,
    isLoaded: false,
    onLoad: fn(),
    onRename: fn(),
    onMove: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof MapRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('The Sunken Crypt')).toBeVisible();
    await expect(canvas.getByText(/Grid calibrated/)).toBeVisible();
  },
};

export const Uncalibrated: Story = {
  args: { hasGridCalibration: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/No grid calibration/)).toBeVisible();
  },
};

export const Video: Story = {
  args: { kind: 'video' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Video/)).toBeVisible();
  },
};

export const Loading: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Load The Sunken Crypt' }),
    );

    await expect(args.onLoad).toHaveBeenCalledOnce();
  },
};

export const Loaded: Story = {
  args: { isLoaded: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'The Sunken Crypt is loaded' }),
    ).toHaveAttribute('aria-pressed', 'true');
  },
};

export const OpeningTheMenu: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'More actions for The Sunken Crypt' }),
    );

    // The menu is portalled to `document.body`, so it's found via `screen`,
    // not `canvas` — see `MapRowMenu`'s own doc comment.
    await expect(
      screen.getByRole('group', { name: 'Actions for The Sunken Crypt' }),
    ).toBeVisible();
    await expect(screen.getByText('Move to folder')).toBeVisible();
    await expect(
      screen.getByRole('button', { name: 'No folder' }),
    ).toHaveAttribute('aria-pressed', 'true');
  },
};

export const Renaming: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'More actions for The Sunken Crypt' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));

    // The rename input isn't portalled — it replaces the row's own name text.
    const input = canvas.getByRole('textbox', { name: 'Map name' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Renamed Crypt{Enter}');

    await expect(args.onRename).toHaveBeenCalledWith('Renamed Crypt');
  },
};

export const MovingToAFolder: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'More actions for The Sunken Crypt' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Towns' }));

    await expect(args.onMove).toHaveBeenCalledWith('f2');
  },
};

export const Removing: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'More actions for The Sunken Crypt' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await expect(args.onRemove).toHaveBeenCalledOnce();
  },
};
