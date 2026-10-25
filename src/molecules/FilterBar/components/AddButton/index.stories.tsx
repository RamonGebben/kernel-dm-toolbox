import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AddButton } from '~/molecules/FilterBar/components/AddButton';

const meta = {
  title: 'Molecules/FilterBar/AddButton',
  component: AddButton,
  args: {
    children: 'Add Button',
  },
} satisfies Meta<typeof AddButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
