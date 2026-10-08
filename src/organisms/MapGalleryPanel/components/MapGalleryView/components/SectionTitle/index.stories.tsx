import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SectionTitle } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/SectionTitle';

const meta = {
  title: 'Organisms/MapGalleryPanel/MapGalleryView/SectionTitle',
  component: SectionTitle,
  args: {
    children: 'Section Title',
  },
} satisfies Meta<typeof SectionTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
