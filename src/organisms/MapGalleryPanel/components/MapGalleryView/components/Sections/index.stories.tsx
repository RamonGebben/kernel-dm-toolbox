import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Sections } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/Sections';

const meta = {
  title: 'Organisms/MapGalleryPanel/MapGalleryView/Sections',
  component: Sections,
  args: {
    children: 'Sections',
  },
} satisfies Meta<typeof Sections>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
