import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Drawer } from '~/organisms/MapControlPanel/components/Drawer';

const meta = {
  title: 'Organisms/MapControlPanel/Drawer',
  component: Drawer,
  args: {
    $isOpen: false,
    children: 'Drawer',
  },
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
