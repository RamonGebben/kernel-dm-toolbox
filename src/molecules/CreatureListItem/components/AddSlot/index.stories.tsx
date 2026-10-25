import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AddSlot } from '~/molecules/CreatureListItem/components/AddSlot';

const meta = {
  title: 'Molecules/CreatureListItem/AddSlot',
  component: AddSlot,
  args: {
    children: 'Add Slot',
  },
} satisfies Meta<typeof AddSlot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
