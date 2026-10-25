import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Group } from '~/molecules/ConfirmButton/components/Group';

const meta = {
  title: 'Molecules/ConfirmButton/Group',
  component: Group,
  args: {
    children: 'Group',
  },
} satisfies Meta<typeof Group>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
