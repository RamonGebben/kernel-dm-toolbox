import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Popover } from '~/molecules/FilterBar/components/Popover';

const meta = {
  title: 'Molecules/FilterBar/Popover',
  component: Popover,
  args: {
    children: 'Popover',
  },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
