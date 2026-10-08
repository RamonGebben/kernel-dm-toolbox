import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HiddenFileInput } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/HiddenFileInput';

const meta = {
  title: 'Organisms/MapGalleryPanel/MapGalleryView/HiddenFileInput',
  component: HiddenFileInput,
  args: {
    'aria-label': 'Hidden File Input',
  },
} satisfies Meta<typeof HiddenFileInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
