import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MenuItem } from '~/molecules/MapRow/components/MenuItem';

const meta = {
  title: 'Molecules/MapRow/MenuItem',
  component: MenuItem,
  args: {
    $isDanger: false,
    children: 'Menu Item',
  },
} satisfies Meta<typeof MenuItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
