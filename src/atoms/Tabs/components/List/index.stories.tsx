import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { List } from '~/atoms/Tabs/components/List';

const meta = {
  title: 'Atoms/Tabs/List',
  component: List,
  args: {
    children: 'List',
  },
} satisfies Meta<typeof List>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
