import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Menu } from '~/molecules/FilterBar/components/Menu';

const meta = {
  title: 'Molecules/FilterBar/Menu',
  component: Menu,
  args: {
    children: 'Menu',
  },
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
