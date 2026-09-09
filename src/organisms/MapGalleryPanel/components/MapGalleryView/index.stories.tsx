import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MapGalleryView } from '~/organisms/MapGalleryPanel/components/MapGalleryView';

const folders = [
  {
    id: 'f1',
    name: 'Dungeons',
    maps: [
      {
        id: 'm1',
        name: 'The Sunken Crypt',
        kind: 'image',
        fileUrl: '/api/maps/m1/file',
        hasGridCalibration: true,
      },
    ],
  },
];

const unfiledMaps = [
  {
    id: 'm2',
    name: 'Tavern Brawl',
    kind: 'video',
    fileUrl: '/api/maps/m2/file',
    hasGridCalibration: false,
  },
];

const meta = {
  title: 'Organisms/MapGalleryPanel/MapGalleryView',
  component: MapGalleryView,
  args: {
    isPending: false,
    folders,
    unfiledMaps,
    isUploading: false,
    uploadError: null,
    activeMapId: null,
    onLoad: fn(),
    onUpload: fn(),
    onCreateFolder: fn(),
    onRenameFolder: fn(),
    onDeleteFolder: fn(),
    onRenameMap: fn(),
    onMoveMap: fn(),
    onRemoveMap: fn(),
  },
} satisfies Meta<typeof MapGalleryView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('heading', { name: /Dungeons/ }),
    ).toBeVisible();
    await expect(canvas.getByText('The Sunken Crypt')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Unfiled' }),
    ).toBeVisible();
    await expect(canvas.getByText('Tavern Brawl')).toBeVisible();
  },
};

export const Pending: Story = {
  args: { isPending: true, folders: [], unfiledMaps: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Loading maps')).toBeVisible();
  },
};

export const Empty: Story = {
  args: { folders: [], unfiledMaps: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No maps yet')).toBeVisible();
  },
};

export const Uploading: Story = {
  args: { isUploading: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Uploading…' }),
    ).toBeDisabled();
  },
};

export const UploadFailed: Story = {
  args: { uploadError: 'File is larger than the 50MB upload limit.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'File is larger than the 50MB upload limit.',
    );
  },
};

export const CreatingAFolder: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText('New folder name'),
      'Towns{Enter}',
    );

    await expect(args.onCreateFolder).toHaveBeenCalledWith('Towns');
  },
};

export const LoadingAMap: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Load The Sunken Crypt' }),
    );

    await expect(args.onLoad).toHaveBeenCalledWith('m1');
  },
};

export const RemovingAMap: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'More actions for Tavern Brawl' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Remove' }));

    await expect(args.onRemoveMap).toHaveBeenCalledWith('m2');
  },
};

export const CollapsingAFolder: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Dungeons (1)' });

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText('The Sunken Crypt')).toBeVisible();

    await userEvent.click(toggle);

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(
      canvas.queryByText('The Sunken Crypt'),
    ).not.toBeInTheDocument();

    await userEvent.click(toggle);

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText('The Sunken Crypt')).toBeVisible();
  },
};

export const DeletingAFolder: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Delete folder Dungeons' }),
    );

    await expect(args.onDeleteFolder).toHaveBeenCalledWith('f1');
  },
};
