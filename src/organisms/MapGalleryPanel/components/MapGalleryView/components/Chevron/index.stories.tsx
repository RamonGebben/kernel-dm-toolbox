import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Chevron } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/Chevron';

const meta = {
  title: 'Organisms/MapGalleryPanel/MapGalleryView/Chevron',
  component: Chevron,
  args: {
    $isExpanded: false,
    children: 'Chevron',
  },
} satisfies Meta<typeof Chevron>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
