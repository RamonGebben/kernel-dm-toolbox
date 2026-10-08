import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CollapseToggle } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/CollapseToggle';

const meta = {
  title: 'Organisms/MapGalleryPanel/MapGalleryView/CollapseToggle',
  component: CollapseToggle,
  args: {
    children: 'Collapse Toggle',
  },
} satisfies Meta<typeof CollapseToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
