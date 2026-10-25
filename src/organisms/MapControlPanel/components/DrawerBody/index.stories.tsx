import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DrawerBody } from '~/organisms/MapControlPanel/components/DrawerBody';

const meta = {
  title: 'Organisms/MapControlPanel/DrawerBody',
  component: DrawerBody,
  args: {
    children: 'Drawer Body',
  },
} satisfies Meta<typeof DrawerBody>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
