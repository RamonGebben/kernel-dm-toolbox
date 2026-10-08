import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Slot } from '~/molecules/NavigationRail/components/Slot';

const meta = {
  title: 'Molecules/NavigationRail/Slot',
  component: Slot,
  args: {
    $isActive: false,
    href: '#',
    children: 'Slot',
  },
} satisfies Meta<typeof Slot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
