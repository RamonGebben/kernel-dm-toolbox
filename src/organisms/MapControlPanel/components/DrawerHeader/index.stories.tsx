import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DrawerHeader } from '~/organisms/MapControlPanel/components/DrawerHeader';

const meta = {
  title: 'Organisms/MapControlPanel/DrawerHeader',
  component: DrawerHeader,
  args: {
    children: 'Drawer Header',
  },
} satisfies Meta<typeof DrawerHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
