import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Menu } from '~/molecules/MapRow/components/Menu';

const meta = {
  title: 'Molecules/MapRow/Menu',
  component: Menu,
  args: {
    children: 'Menu',
  },
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
