import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { List } from '~/atoms/CheckboxList/components/List';

const meta = {
  title: 'Atoms/CheckboxList/List',
  component: List,
  args: {
    children: 'List',
  },
} satisfies Meta<typeof List>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
