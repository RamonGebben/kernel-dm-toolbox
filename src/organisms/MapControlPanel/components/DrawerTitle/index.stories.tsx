import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DrawerTitle } from '~/organisms/MapControlPanel/components/DrawerTitle';

const meta = {
  title: 'Organisms/MapControlPanel/DrawerTitle',
  component: DrawerTitle,
  args: {
    children: 'Drawer Title',
  },
} satisfies Meta<typeof DrawerTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
