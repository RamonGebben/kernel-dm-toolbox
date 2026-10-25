import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Toolbar } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/Toolbar';

const meta = {
  title: 'Organisms/MapGalleryPanel/MapGalleryView/Toolbar',
  component: Toolbar,
  args: {
    children: 'Toolbar',
  },
} satisfies Meta<typeof Toolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
