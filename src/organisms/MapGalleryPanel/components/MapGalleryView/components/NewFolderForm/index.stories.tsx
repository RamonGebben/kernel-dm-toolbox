import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NewFolderForm } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/NewFolderForm';

const meta = {
  title: 'Organisms/MapGalleryPanel/MapGalleryView/NewFolderForm',
  component: NewFolderForm,
  args: {
    children: 'New Folder Form',
  },
} satisfies Meta<typeof NewFolderForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
