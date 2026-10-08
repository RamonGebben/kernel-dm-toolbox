import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MenuItem } from '~/molecules/FilterBar/components/MenuItem';

const meta = {
  title: 'Molecules/FilterBar/MenuItem',
  component: MenuItem,
  args: {
    children: 'Menu Item',
  },
} satisfies Meta<typeof MenuItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
